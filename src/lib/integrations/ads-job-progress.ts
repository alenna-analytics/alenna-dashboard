import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { CatalogJobApi } from '@/lib/types/catalog'

const CAMPAIGN_TYPE_LABEL_KEYS: Record<string, ShellStringKey> = {
  sponsored_products: 'adsCampaignTypeSponsoredProducts',
  sponsored_brands: 'adsCampaignTypeSponsoredBrands',
  sponsored_display: 'adsCampaignTypeSponsoredDisplay',
}

function campaignTypeLabel(lang: string, raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  const key = CAMPAIGN_TYPE_LABEL_KEYS[raw]
  return key ? shellT(lang, key) : raw.replaceAll('_', ' ')
}

/** True when Amazon Ads is polling / waiting on Reporting API. */
export function isAdsWaitingAmazonReport(
  job: CatalogJobApi | null | undefined,
): boolean {
  if (!job || (job.status !== 'queued' && job.status !== 'running')) return false
  const prog = job.progress
  if (!prog || typeof prog !== 'object') return false
  if (prog.phase === 'waiting_amazon_report') return true
  if (prog.ads_report_pending === true) return true
  return typeof prog.ads_report_id === 'string' && prog.ads_report_id.length > 0
}

export function buildAdsProgressSubtitle(job: CatalogJobApi, lang: string): string {
  if (job.status === 'queued') return shellT(lang, 'amazonSyncProgressQueued')
  if (job.status !== 'running') return shellT(lang, 'syncRunning')

  if (!isAdsWaitingAmazonReport(job)) {
    return shellT(lang, 'syncRunning')
  }

  const prog = job.progress ?? {}
  const typeLabel = campaignTypeLabel(lang, prog.ads_campaign_type)
  const start = typeof prog.ads_window_start === 'string' ? prog.ads_window_start : null
  const end = typeof prog.ads_window_end === 'string' ? prog.ads_window_end : null

  if (typeLabel && start && end) {
    return shellT(lang, 'adsSyncWaitingAmazonReportDetail', {
      type: typeLabel,
      start,
      end,
    })
  }
  return shellT(lang, 'adsSyncWaitingAmazonReport')
}
