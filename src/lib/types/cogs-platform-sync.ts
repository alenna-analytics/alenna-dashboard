export type CogsPlatformSyncDiffStatus =
  | 'same'
  | 'different'
  | 'missing_platform_cost'
  | 'currency_mismatch'
  | 'missing_current_cost'

export type CogsPlatformSyncPreviewItemApi = {
  product_id: string
  sku: string
  name: string
  current_cost: number | null
  platform_cost: number | null
  diff_status: CogsPlatformSyncDiffStatus
  currency_mismatch: boolean
}

export type CogsPlatformSyncPreviewSummaryApi = {
  matched: number
  same: number
  different: number
  missing_platform_cost: number
  currency_mismatch: number
  missing_current_cost: number
}

export type CogsPlatformSyncPreviewResponse = {
  items: CogsPlatformSyncPreviewItemApi[]
  summary: CogsPlatformSyncPreviewSummaryApi
  connection_label: string
  base_currency: string
}

export type CogsPlatformSyncApplyErrorApi = {
  product_id: string
  message: string
}

export type CogsPlatformSyncApplyResponse = {
  updated_count: number
  skipped_count: number
  errors: CogsPlatformSyncApplyErrorApi[]
  backfill_jobs: { product_id: string; job_id: string; status: string }[]
}

export type CogsPlatformSyncPreviewBody = {
  platform: 'shopify'
  platform_connection_id: string
}

export type CogsPlatformSyncApplyBody = {
  platform: 'shopify'
  platform_connection_id: string
  product_ids: string[]
}

export type CogsPlatformSyncApiErrorDetail = {
  error_code?: string
  message?: string
}
