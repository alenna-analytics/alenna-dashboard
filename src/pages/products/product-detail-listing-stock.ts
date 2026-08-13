import type { ProductListingApi } from '@/lib/types/catalog'

import { resolveListingVariantId } from './product-detail-listing-channel-format'

function listingStockPoolKey(listing: Pick<ProductListingApi, 'platform' | 'platform_sku'>): string {
  return `${listing.platform}\0${listing.platform_sku.trim().toLowerCase()}`
}

/** Listings that share the same on-hand stock pool (same channel SKU, multiple publications). */
export function sharedStockListingIds(listings: ProductListingApi[]): Set<string> {
  const byPool = new Map<string, ProductListingApi[]>()
  for (const listing of listings) {
    const key = listingStockPoolKey(listing)
    const group = byPool.get(key)
    if (group) group.push(listing)
    else byPool.set(key, [listing])
  }

  const shared = new Set<string>()
  for (const group of byPool.values()) {
    if (group.length <= 1) continue
    const stocks = group.map((listing) => listing.stock_quantity)
    const firstStock = stocks[0]
    if (firstStock == null || !stocks.every((stock) => stock === firstStock)) continue

    const sorted = [...group].sort((a, b) => {
      const variantCmp = (resolveListingVariantId(a) ?? '').localeCompare(
        resolveListingVariantId(b) ?? '',
      )
      if (variantCmp !== 0) return variantCmp
      return a.id.localeCompare(b.id)
    })
    for (const listing of sorted.slice(1)) {
      shared.add(listing.id)
    }
  }
  return shared
}
