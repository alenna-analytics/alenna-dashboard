import type { ProductDetailApi, StockAlertLevel } from '@/lib/types/catalog'
import type { ProductLinkGroupApi } from '@/lib/types/product-links'

export type InventoryByChannelRow = {
  platform: string
  stock: number
  velocity: number | null
  inventoryDays: number | null
  stockAlert: StockAlertLevel
  /** Product dimension: stable row id + display label. */
  id?: string
  label?: string
  isTotal?: boolean
}

function worstStockAlert(a: StockAlertLevel, b: StockAlertLevel): StockAlertLevel {
  const rank = (level: StockAlertLevel) => {
    if (level === 'out') return 0
    if (level === 'low') return 1
    return 2
  }
  return rank(a) <= rank(b) ? a : b
}

function alertFromStock(stock: number): StockAlertLevel {
  return stock <= 0 ? 'out' : 'none'
}

export function inventoryRowsFromProductDetail(
  detail: ProductDetailApi,
): InventoryByChannelRow[] {
  const bySlug = new Map<string, InventoryByChannelRow>()
  for (const listing of detail.listings) {
    const key = listing.platform.trim().toLowerCase()
    const stock = listing.stock_quantity ?? 0
    const velocity = listing.velocity_units_per_day_90d
    const inventoryDays = listing.inventory_days
    const stockAlert = listing.stock_alert ?? alertFromStock(stock)
    const existing = bySlug.get(key)
    if (!existing) {
      bySlug.set(key, {
        platform: listing.platform,
        stock,
        velocity,
        inventoryDays,
        stockAlert,
      })
      continue
    }
    existing.stock += stock
    existing.stockAlert = worstStockAlert(existing.stockAlert, stockAlert)
    if (velocity != null) {
      existing.velocity = (existing.velocity ?? 0) + velocity
    }
    if (inventoryDays != null && existing.inventoryDays == null) {
      existing.inventoryDays = inventoryDays
    } else if (
      inventoryDays != null &&
      existing.inventoryDays != null &&
      existing.velocity != null &&
      existing.velocity > 0
    ) {
      existing.inventoryDays =
        Math.round((existing.stock / existing.velocity) * 10) / 10
    }
  }
  return [...bySlug.values()]
}

export function inventoryRowsFromProductGroup(
  group: ProductLinkGroupApi,
): InventoryByChannelRow[] {
  const bySlug = new Map<string, InventoryByChannelRow>()

  const ensure = (platform: string): InventoryByChannelRow | null => {
    const key = platform.trim().toLowerCase()
    if (!key) return null
    const existing = bySlug.get(key)
    if (existing) return existing
    const row: InventoryByChannelRow = {
      platform,
      stock: 0,
      velocity: null,
      inventoryDays: null,
      stockAlert: 'none',
    }
    bySlug.set(key, row)
    return row
  }

  for (const row of group.inventory_by_platform ?? []) {
    const target = ensure(row.platform)
    if (!target) continue
    target.stock += row.stock_quantity ?? 0
    target.stockAlert = worstStockAlert(target.stockAlert, alertFromStock(target.stock))
    if (row.velocity_units_per_day_90d != null) {
      target.velocity = (target.velocity ?? 0) + row.velocity_units_per_day_90d
    }
    if (row.inventory_days != null) {
      target.inventoryDays =
        target.velocity != null && target.velocity > 0
          ? Math.round((target.stock / target.velocity) * 10) / 10
          : row.inventory_days
    }
  }

  if (bySlug.size === 0) {
    for (const row of group.period_by_platform ?? []) {
      ensure(row.platform)
    }
    for (const member of group.members) {
      const target = ensure(member.platform)
      if (!target) continue
      target.stock += member.stock_quantity ?? 0
      target.stockAlert = worstStockAlert(target.stockAlert, alertFromStock(target.stock))
    }
  }

  const rows = [...bySlug.values()]
  if (rows.length === 0) return rows

  const needsVelocity = rows.some((row) => row.velocity == null)
  if (!needsVelocity) return rows

  const periodRows = group.period_by_platform ?? []
  const totalUnits = periodRows.reduce(
    (sum, row) => sum + (row.net_units_sold || row.gross_units_sold || row.units_sold || 0),
    0,
  )
  const groupVelocity = group.velocity_units_per_day_90d

  for (const row of rows) {
    if (row.velocity != null) continue
    const key = row.platform.trim().toLowerCase()
    const period = periodRows.find((p) => p.platform.trim().toLowerCase() === key)
    const units = period
      ? period.net_units_sold || period.gross_units_sold || period.units_sold || 0
      : 0
    if (groupVelocity != null && totalUnits > 0 && units > 0) {
      row.velocity = groupVelocity * (units / totalUnits)
      if (row.velocity > 0) {
        row.inventoryDays = Math.round((row.stock / row.velocity) * 10) / 10
      }
    } else if (rows.length === 1) {
      row.velocity = group.velocity_units_per_day_90d
      row.inventoryDays = group.inventory_days
    }
  }

  return rows
}

/** One inventory row per group member (product dimension). */
export function inventoryRowsFromGroupMembers(
  members: ProductLinkGroupApi['members'],
  group: ProductLinkGroupApi,
): InventoryByChannelRow[] {
  const platformInventory = new Map(
    (group.inventory_by_platform ?? []).map((row) => [
      row.platform.trim().toLowerCase(),
      row,
    ]),
  )

  return members.map((member) => {
    const platformKey = member.platform.trim().toLowerCase()
    const platformRow = platformKey ? platformInventory.get(platformKey) : undefined
    const stock = member.stock_quantity ?? 0
    const samePlatformCount = members.filter(
      (item) => item.platform.trim().toLowerCase() === platformKey,
    ).length
    const velocity =
      samePlatformCount === 1 ? (platformRow?.velocity_units_per_day_90d ?? null) : null
    const inventoryDays =
      velocity != null && velocity > 0
        ? Math.round((stock / velocity) * 10) / 10
        : samePlatformCount === 1
          ? (platformRow?.inventory_days ?? null)
          : null

    return {
      id: member.product_id,
      label: member.variant_label?.trim() || member.title,
      platform: member.platform,
      stock,
      velocity,
      inventoryDays,
      stockAlert: alertFromStock(stock),
    }
  })
}

export function withInventoryTotalRow(
  rows: InventoryByChannelRow[],
  totalLabel: string,
): InventoryByChannelRow[] {
  if (rows.length === 0) return rows
  const stock = rows.reduce((sum, row) => sum + row.stock, 0)
  const velocitySum = rows.reduce(
    (sum, row) => sum + (row.velocity != null && row.velocity > 0 ? row.velocity : 0),
    0,
  )
  const hasVelocity = rows.some((row) => row.velocity != null && row.velocity > 0)
  const velocity = hasVelocity ? velocitySum : null
  const inventoryDays =
    velocity != null && velocity > 0
      ? Math.round((stock / velocity) * 10) / 10
      : null
  const stockAlert = rows.reduce<StockAlertLevel>(
    (worst, row) => worstStockAlert(worst, row.stockAlert),
    'none',
  )
  return [
    ...rows,
    {
      id: '__total__',
      platform: totalLabel,
      label: totalLabel,
      stock,
      velocity,
      inventoryDays,
      stockAlert,
      isTotal: true,
    },
  ]
}
