import type { AdsChannelRow } from '@/pages/ads/use-ads-kpis'

export type AdsNetworkId = 'google_ads' | 'meta_ads' | 'amazon_ads' | 'mercadolibre_ads'

export type PlatformAdsRollup = {
  /** Spend by ads network for this ecommerce platform column. */
  byNetwork: Record<AdsNetworkId, number>
  /** Attributed sales (all linked ads) for ROAS. */
  attributedSales: number
  /** Linked ads spend (excludes tenant unlinked). */
  linkedSpend: number
}

const EMPTY_NETWORKS: Record<AdsNetworkId, number> = {
  google_ads: 0,
  meta_ads: 0,
  amazon_ads: 0,
  mercadolibre_ads: 0,
}

const NETWORK_ALIASES: Record<string, AdsNetworkId> = {
  google_ads: 'google_ads',
  google: 'google_ads',
  meta_ads: 'meta_ads',
  meta: 'meta_ads',
  facebook_ads: 'meta_ads',
  facebook: 'meta_ads',
  amazon_ads: 'amazon_ads',
  amazon: 'amazon_ads',
  mercadolibre_ads: 'mercadolibre_ads',
  mercadolibre: 'mercadolibre_ads',
  meli_ads: 'mercadolibre_ads',
}

function normalizeNetwork(platform: string): AdsNetworkId | null {
  const key = platform.trim().toLowerCase()
  return NETWORK_ALIASES[key] ?? null
}

function emptyRollup(): PlatformAdsRollup {
  return {
    byNetwork: { ...EMPTY_NETWORKS },
    attributedSales: 0,
    linkedSpend: 0,
  }
}

/**
 * Map ads channel rows onto ecommerce platform slugs via linked commerce connections.
 * Unlinked ads are ignored for per-platform columns (caller may show tenant_ads_spend as Otros).
 */
export function aggregateAdsByEcommercePlatform(
  adsItems: AdsChannelRow[],
  connectionIdToPlatform: Record<string, string>,
  platforms: Array<{ slug: string }>,
): Record<string, PlatformAdsRollup> {
  const out: Record<string, PlatformAdsRollup> = {}
  for (const p of platforms) {
    out[p.slug] = emptyRollup()
  }
  out.total = emptyRollup()

  for (const row of adsItems) {
    const commerceId = row.linked_commerce_connection_id
    if (!commerceId) continue
    const ecommerceSlug = connectionIdToPlatform[commerceId]?.trim().toLowerCase()
    if (!ecommerceSlug || !out[ecommerceSlug]) continue

    const network = normalizeNetwork(row.platform)
    const spend = Number(row.spend) || 0
    const sales = Number(row.attributed_sales) || 0

    const target = out[ecommerceSlug]
    target.linkedSpend += spend
    target.attributedSales += sales
    if (network) target.byNetwork[network] += spend

    out.total.linkedSpend += spend
    out.total.attributedSales += sales
    if (network) out.total.byNetwork[network] += spend
  }

  return out
}

/** TACOS = ads_spend / net_revenue; null when net is 0. */
export function tacosPct(adsSpend: number, netRevenue: number): number | null {
  if (!Number.isFinite(netRevenue) || netRevenue === 0) return null
  if (!Number.isFinite(adsSpend)) return null
  return (adsSpend / netRevenue) * 100
}

/** Attributed ROAS = attributed_sales / spend; null when spend is 0. */
export function attributedRoas(attributedSales: number, spend: number): number | null {
  if (!Number.isFinite(spend) || spend === 0) return null
  if (!Number.isFinite(attributedSales)) return null
  return attributedSales / spend
}
