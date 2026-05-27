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

function detailLocale(lang: string): string {
  return lang === 'en' ? 'en-US' : 'es-MX'
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

export function latestListingSyncIso(detail: ProductDetailApi): string {
  let latestMs = new Date(detail.updated_at).getTime()
  for (const listing of detail.listings) {
    if (!listing.stock_observed_at) continue
    const ms = new Date(listing.stock_observed_at).getTime()
    if (ms > latestMs) latestMs = ms
  }
  return new Date(latestMs).toISOString()
}
