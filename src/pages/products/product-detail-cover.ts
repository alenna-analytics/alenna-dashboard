import type { ProductDetailApi, ProductListingApi } from '@/lib/types/catalog'

import { PRODUCT_DETAIL_ALL_CHANNELS } from './product-detail-analytics-filter'
import {
  coverAlert,
  inventoryDaysFromStockVelocity,
  reorderPointUnits,
  stockoutDate,
  type ChannelCoverAlert,
  type ChannelCoverRow,
} from './vinculacion/group-channel-cover'

function slug(platform: string): string {
  return platform.trim().toLowerCase()
}

function listingStock(listing: ProductListingApi): number | null {
  const stock = listing.stock_quantity
  if (stock == null || !Number.isFinite(stock)) return null
  return Math.max(0, stock)
}

function channelVelocity(listings: ProductListingApi[]): number | null {
  const values = listings.map((listing) => listing.velocity_units_per_day_90d)
  if (values.length === 0) return null
  if (values.every((value) => value != null && value <= 0)) return 0
  if (values.some((value) => value == null || value <= 0)) return null
  return values.reduce((sum: number, value) => sum + (value ?? 0), 0)
}

function worstAlert(alerts: ChannelCoverAlert[]): ChannelCoverAlert {
  if (alerts.includes('critical')) return 'critical'
  if (alerts.includes('attention')) return 'attention'
  if (alerts.length === 0 || alerts.every((alert) => alert === 'unknown')) return 'unknown'
  return 'normal'
}

export function buildProductCoverRows(
  detail: ProductDetailApi,
  channelFilter: string,
  today: Date,
): ChannelCoverRow[] {
  const listings = detail.listings.filter(
    (listing) =>
      channelFilter === PRODUCT_DETAIL_ALL_CHANNELS || slug(listing.platform) === channelFilter,
  )
  const bySlug = new Map<string, ProductListingApi[]>()
  const order: string[] = []
  for (const listing of listings) {
    const key = slug(listing.platform)
    if (!key) continue
    const existing = bySlug.get(key)
    if (existing) {
      existing.push(listing)
      continue
    }
    bySlug.set(key, [listing])
    order.push(key)
  }

  const channels: ChannelCoverRow[] = order.map((key) => {
    const platformListings = bySlug.get(key) ?? []
    const platform = platformListings[0]?.platform ?? key
    const memberStocks = platformListings.map(listingStock)
    const knownStocks = memberStocks.filter((value): value is number => value != null)
    const stockKnown = memberStocks.length > 0 && knownStocks.length === memberStocks.length
    const stock = knownStocks.reduce((sum, value) => sum + value, 0)
    const velocity = channelVelocity(platformListings)
    const inventoryDays = stockKnown ? inventoryDaysFromStockVelocity(stock, velocity) : null
    return {
      id: key,
      platform,
      publicationCount: platformListings.length,
      memberStocks,
      stockKnown,
      stock,
      velocity,
      inventoryDays,
      stockoutOn: stockoutDate(inventoryDays, today),
      reorderPoint: reorderPointUnits(velocity, null),
      leadTimeMissing: true,
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
  const allQuiet = channels.every((row) => row.velocity != null && row.velocity <= 0)
  const velocitySum = channels.reduce(
    (sum, row) => sum + (row.velocity != null && row.velocity > 0 ? row.velocity : 0),
    0,
  )
  const velocity = allQuiet ? 0 : !missingVelocity && velocitySum > 0 ? velocitySum : null
  const inventoryDays = stockKnown ? inventoryDaysFromStockVelocity(stock, velocity) : null

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
      reorderPoint: null,
      leadTimeMissing: true,
      alert: stockKnown ? worstAlert(channels.map((row) => row.alert)) : 'unknown',
      isTotal: true,
    },
  ]
}
