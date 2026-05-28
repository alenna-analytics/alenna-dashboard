import type { ProductDetailApi, ProductListingApi } from '@/lib/types/catalog'

export function uniqueActivePlatforms(listings: readonly ProductListingApi[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const listing of listings) {
    if (!listing.active) continue
    const slug = listing.platform.trim().toLowerCase()
    if (seen.has(slug)) continue
    seen.add(slug)
    out.push(listing.platform)
  }
  return out
}

export function productDetailDateLocale(lang: string): string {
  return lang === 'en' ? 'en-US' : 'es-MX'
}

function detailLocale(lang: string): string {
  return productDetailDateLocale(lang)
}

export function formatProductDetailDate(iso: string, lang: string): string {
  return new Date(iso).toLocaleDateString(detailLocale(lang), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatProductDetailDateTime(iso: string, lang: string): string {
  return new Date(iso).toLocaleString(detailLocale(lang), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Latest channel catalog touch across listings (Shopify, etc.); excludes Alenna manual edits. */
export function latestListingSyncIso(detail: ProductDetailApi): string | null {
  let latestMs: number | null = null
  for (const listing of detail.listings) {
    const iso = listing.platform_synced_at
    if (!iso) continue
    const ms = new Date(iso).getTime()
    if (latestMs == null || ms > latestMs) latestMs = ms
  }
  return latestMs != null ? new Date(latestMs).toISOString() : null
}
