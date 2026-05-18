import { shellT } from '@/lib/i18n/shell-strings'
import type { CatalogJobApi } from '@/lib/types/catalog'

export type ShopifyJobProgressInfo = {
  ordersProcessed: number | null
  oldestProcessedYear: number | null
}

export function extractShopifyJobProgressInfo(
  job: CatalogJobApi | null | undefined,
): ShopifyJobProgressInfo {
  const prog = job?.progress ?? null
  if (!prog) return { ordersProcessed: null, oldestProcessedYear: null }
  const processedRaw = prog.processed_count ?? prog.orders_processed
  const ordersProcessed =
    typeof processedRaw === 'number'
      ? processedRaw
      : typeof processedRaw === 'string'
        ? Number.parseInt(processedRaw, 10)
        : null
  const oldestRaw = prog.oldest_processed_created_at
  const oldestProcessedYear =
    typeof oldestRaw === 'string' && /^\d{4}-/.test(oldestRaw)
      ? Number.parseInt(oldestRaw.slice(0, 4), 10)
      : null
  return { ordersProcessed, oldestProcessedYear }
}

export function buildShopifyProgressSubtitle(
  job: CatalogJobApi,
  lang: string,
): string {
  if (job.status === 'queued') return shellT(lang, 'shopifySyncProgressQueued')
  if (job.status !== 'running') return shellT(lang, 'syncRunning')
  const { ordersProcessed, oldestProcessedYear } = extractShopifyJobProgressInfo(job)
  if (
    ordersProcessed != null &&
    !Number.isNaN(ordersProcessed) &&
    oldestProcessedYear != null
  ) {
    return shellT(lang, 'syncProgressLabel', {
      year: String(oldestProcessedYear),
      count: ordersProcessed.toLocaleString(),
    })
  }
  if (ordersProcessed != null && !Number.isNaN(ordersProcessed)) {
    return `${shellT(lang, 'shopifySyncProgressOrders')}: ${ordersProcessed.toLocaleString()}`
  }
  return shellT(lang, 'syncRunning')
}

export function buildShopifySuccessSubtitle(job: CatalogJobApi, lang: string): string {
  const parts: string[] = [`${job.records_synced ?? 0} ${shellT(lang, 'reportsOrders')}`]
  const cat = job.catalog_products_upserted ?? 0
  if (cat > 0) {
    parts.push(`${cat} ${shellT(lang, 'syncProductsUpdated')}`)
  }
  return parts.join(' · ')
}
