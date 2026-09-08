import type { ProductDetailApi } from '@/lib/types/catalog'
import type { ProductLinkGroupApi } from '@/lib/types/product-links'

export type InventoryByChannelRow = {
  platform: string
  stock: number
  velocity: number | null
  inventoryDays: number | null
  /** Product dimension: stable row id + display label. */
  id?: string
  label?: string
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
    const existing = bySlug.get(key)
    if (!existing) {
      bySlug.set(key, {
        platform: listing.platform,
        stock,
        velocity,
        inventoryDays,
      })
      continue
    }
    existing.stock += stock
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
      // Recompute days from aggregated stock / velocity when possible.
      existing.inventoryDays = Math.round(existing.stock / existing.velocity)
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
    }
    bySlug.set(key, row)
    return row
  }

  // Prefer listing-accurate inventory from the API (same idea as product listings).
  for (const row of group.inventory_by_platform ?? []) {
    const target = ensure(row.platform)
    if (!target) continue
    target.stock += row.stock_quantity ?? 0
    if (row.velocity_units_per_day_90d != null) {
      target.velocity = (target.velocity ?? 0) + row.velocity_units_per_day_90d
    }
    if (row.inventory_days != null) {
      target.inventoryDays =
        target.velocity != null && target.velocity > 0
          ? Math.round(target.stock / target.velocity)
          : row.inventory_days
    }
  }

  if (bySlug.size === 0) {
    // Same channel universe as the group P&L table.
    for (const row of group.period_by_platform ?? []) {
      ensure(row.platform)
    }
    for (const member of group.members) {
      const target = ensure(member.platform)
      if (!target) continue
      target.stock += member.stock_quantity ?? 0
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
        row.inventoryDays = Math.round(row.stock / row.velocity)
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
    // Member payload has stock only; borrow platform velocity when this is the sole
    // member on that channel, otherwise leave blank rather than double-count.
    const samePlatformCount = members.filter(
      (item) => item.platform.trim().toLowerCase() === platformKey,
    ).length
    const velocity =
      samePlatformCount === 1 ? (platformRow?.velocity_units_per_day_90d ?? null) : null
    const inventoryDays =
      velocity != null && velocity > 0
        ? Math.round(stock / velocity)
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
    }
  })
}
