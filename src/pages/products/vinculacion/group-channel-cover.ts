import type {
  ProductLinkGroupApi,
  ProductLinkGroupMemberApi,
} from '@/lib/types/product-links'

/** Cover below this many days is critical. 7–14 is attention. Above 14 is normal. */
export const CRITICAL_COVER_DAYS = 7
export const ATTENTION_COVER_DAYS = 14

/** Reorder point = velocity × lead time × this factor. */
export const REORDER_LEAD_TIME_FACTOR = 1.2

export type ChannelCoverAlert = 'critical' | 'attention' | 'normal' | 'unknown'

export type ChannelCoverRow = {
  id: string
  platform: string
  publicationCount: number
  memberStocks: Array<number | null>
  stockKnown: boolean
  stock: number
  velocity: number | null
  inventoryDays: number | null
  stockoutOn: Date | null
  reorderPoint: number | null
  leadTimeMissing: boolean
  alert: ChannelCoverAlert
  isTotal: boolean
}

function platformSlug(platform: string): string {
  return platform.trim().toLowerCase()
}

function memberStock(member: ProductLinkGroupMemberApi): number | null {
  const stock = member.stock_quantity
  if (stock == null || !Number.isFinite(stock)) return null
  return Math.max(0, stock)
}

export function inventoryDaysFromStockVelocity(
  stock: number,
  velocity: number | null,
): number | null {
  if (velocity == null || !Number.isFinite(velocity) || velocity <= 0) return null
  return Math.round((stock / velocity) * 10) / 10
}

export function coverAlert(
  stock: number,
  days: number | null,
  velocity: number | null = null,
): ChannelCoverAlert {
  if (stock <= 0) return 'critical'
  if (velocity != null && velocity <= 0) return 'unknown'
  if (days == null) return 'unknown'
  if (days < CRITICAL_COVER_DAYS) return 'critical'
  if (days <= ATTENTION_COVER_DAYS) return 'attention'
  return 'normal'
}

/** Calendar day of today + rounded days of cover. */
export function stockoutDate(days: number | null, today: Date): Date | null {
  if (days == null || !Number.isFinite(days)) return null
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  date.setDate(date.getDate() + Math.round(days))
  return date
}

export function reorderPointUnits(
  velocity: number | null,
  leadTimeDays: number | null,
): number | null {
  if (velocity == null || !Number.isFinite(velocity) || velocity <= 0) return null
  if (leadTimeDays == null || !Number.isFinite(leadTimeDays) || leadTimeDays <= 0) return null
  return velocity * leadTimeDays * REORDER_LEAD_TIME_FACTOR
}

function worstAlert(alerts: ChannelCoverAlert[]): ChannelCoverAlert {
  if (alerts.includes('critical')) return 'critical'
  if (alerts.includes('attention')) return 'attention'
  if (alerts.length === 0 || alerts.every((alert) => alert === 'unknown')) return 'unknown'
  return 'normal'
}

export function buildChannelCoverRows(
  group: ProductLinkGroupApi,
  members: ProductLinkGroupMemberApi[],
  today: Date,
  leadTimeDays: number | null = null,
): ChannelCoverRow[] {
  const bySlug = new Map<string, ProductLinkGroupMemberApi[]>()
  const order: string[] = []
  for (const member of members) {
    const slug = platformSlug(member.platform)
    if (!slug) continue
    const existing = bySlug.get(slug)
    if (existing) {
      existing.push(member)
      continue
    }
    bySlug.set(slug, [member])
    order.push(slug)
  }

  const inventoryBySlug = new Map(
    (group.inventory_by_platform ?? []).map((row) => [platformSlug(row.platform), row] as const),
  )
  const membersBySlug = new Map<string, number>()
  for (const member of group.members) {
    const slug = platformSlug(member.platform)
    if (!slug) continue
    membersBySlug.set(slug, (membersBySlug.get(slug) ?? 0) + 1)
  }

  const channels: ChannelCoverRow[] = order.map((slug) => {
    const platformMembers = bySlug.get(slug) ?? []
    const platform = platformMembers[0]?.platform ?? slug
    const memberStocks = platformMembers.map(memberStock)
    const knownStocks = memberStocks.filter((value): value is number => value != null)
    const stockKnown = memberStocks.length > 0 && knownStocks.length === memberStocks.length
    const stock = knownStocks.reduce((sum, value) => sum + value, 0)
    const fullPlatform = platformMembers.length === (membersBySlug.get(slug) ?? 0)
    const inventory = inventoryBySlug.get(slug)
    const velocity =
      fullPlatform && inventory?.velocity_units_per_day_90d != null
        ? inventory.velocity_units_per_day_90d
        : null
    const inventoryDays = stockKnown ? inventoryDaysFromStockVelocity(stock, velocity) : null
    const reorderPoint = reorderPointUnits(velocity, leadTimeDays)
    return {
      id: slug,
      platform,
      publicationCount: platformMembers.length,
      memberStocks,
      stockKnown,
      stock,
      velocity,
      inventoryDays,
      stockoutOn: stockoutDate(inventoryDays, today),
      reorderPoint,
      leadTimeMissing: reorderPoint == null,
      alert: stockKnown ? coverAlert(stock, inventoryDays, velocity) : 'unknown',
      isTotal: false,
    }
  })

  if (channels.length === 0) return channels

  const stockKnown = channels.every((row) => row.stockKnown)
  const stock = channels.reduce((sum, row) => sum + row.stock, 0)
  const missingVelocity = channels.some(
    (row) => row.stockKnown && row.stock > 0 && (row.velocity == null || row.velocity <= 0),
  )
  const velocitySum = channels.reduce(
    (sum, row) => sum + (row.velocity != null && row.velocity > 0 ? row.velocity : 0),
    0,
  )
  const velocity = !missingVelocity && velocitySum > 0 ? velocitySum : null
  const inventoryDays = stockKnown ? inventoryDaysFromStockVelocity(stock, velocity) : null
  const reorderPoint = reorderPointUnits(velocity, leadTimeDays)

  return [
    ...channels,
    {
      id: '__total__',
      platform: '',
      publicationCount: channels.reduce((sum, row) => sum + row.publicationCount, 0),
      memberStocks: [],
      stockKnown,
      stock,
      velocity,
      inventoryDays,
      stockoutOn: null,
      reorderPoint,
      leadTimeMissing: reorderPoint == null,
      alert: stockKnown ? worstAlert(channels.map((row) => row.alert)) : 'unknown',
      isTotal: true,
    },
  ]
}
