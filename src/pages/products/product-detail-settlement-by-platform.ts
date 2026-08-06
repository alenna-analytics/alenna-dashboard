import type {
  ProductListingApi,
  ProductPlatformSettlementApi,
  ProductSettlementApi,
} from '@/lib/types/catalog'

function mergeCompleteness(a: string, b: string): string {
  const rank = (c: string) => {
    const x = c.trim().toLowerCase()
    if (x === 'unavailable') return 0
    if (x === 'partial') return 1
    return 2
  }
  return rank(a) <= rank(b) ? a : b
}

function addSettlement(target: ProductSettlementApi, row: ProductSettlementApi): ProductSettlementApi {
  return {
    gross_revenue: target.gross_revenue + row.gross_revenue,
    discounts: target.discounts + row.discounts,
    returns: target.returns + row.returns,
    net_revenue: target.net_revenue + row.net_revenue,
    marketplace_fees: target.marketplace_fees + row.marketplace_fees,
    shipping_charges: target.shipping_charges + row.shipping_charges,
    tax_withholdings: target.tax_withholdings + row.tax_withholdings,
    estimated_payout: target.estimated_payout + row.estimated_payout,
    completeness: mergeCompleteness(target.completeness, row.completeness),
  }
}

export function mergeListingSettlementsByPlatform(
  listings: ProductListingApi[],
): ProductPlatformSettlementApi[] {
  const byPlatform = new Map<string, ProductSettlementApi>()

  for (const listing of listings) {
    const settlement = listing.period_settlement
    if (!settlement) continue
    const slug = listing.platform.trim().toLowerCase()
    const existing = byPlatform.get(slug)
    byPlatform.set(slug, existing ? addSettlement(existing, settlement) : { ...settlement })
  }

  return Array.from(byPlatform.entries())
    .map(([platform, settlement]) => ({ platform, ...settlement }))
    .sort((a, b) => a.platform.localeCompare(b.platform))
}

export function listingCountByPlatform(
  listings: ProductListingApi[],
  platformSlug: string,
): number {
  const slug = platformSlug.trim().toLowerCase()
  return listings.filter(
    (listing) =>
      listing.platform.trim().toLowerCase() === slug && listing.period_settlement !== null,
  ).length
}

export function resolveProductPlatformSettlement(params: {
  channelFilter: string
  periodSettlement: ProductSettlementApi | null | undefined
  periodSettlementByPlatform: ProductPlatformSettlementApi[]
  listings: ProductListingApi[]
}): ProductSettlementApi | null {
  const { channelFilter, periodSettlement, periodSettlementByPlatform, listings } = params
  if (channelFilter === 'all') {
    return periodSettlement ?? null
  }

  const slug = channelFilter.trim().toLowerCase()
  const fromApi = periodSettlementByPlatform.find(
    (row) => row.platform.trim().toLowerCase() === slug,
  )
  if (fromApi) return fromApi

  const merged = mergeListingSettlementsByPlatform(listings)
  return merged.find((row) => row.platform.trim().toLowerCase() === slug) ?? null
}

export function platformSettlementFilterOptions(
  periodSettlementByPlatform: ProductPlatformSettlementApi[],
  listings: ProductListingApi[],
): string[] {
  const slugs = new Set<string>()
  for (const row of periodSettlementByPlatform) {
    slugs.add(row.platform.trim().toLowerCase())
  }
  for (const listing of listings) {
    if (listing.period_settlement) {
      slugs.add(listing.platform.trim().toLowerCase())
    }
  }
  return Array.from(slugs).sort((a, b) => a.localeCompare(b))
}
