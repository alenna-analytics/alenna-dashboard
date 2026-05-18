export type IntegrationPlatformRow = {
  slug: string
  name: string
  is_available: boolean
  sort_order: number
}

export type FullHistoryWindow = {
  start_date: string
  end_date: string
}

export type SyncPlanStatus =
  | 'not_synced'
  | 'syncing'
  | 'synced'
  | 'partial'
  | 'failed'

export type SyncCooldownReason =
  | 'shopify_full_sync_cooldown'
  | 'shopify_full_sync_failed_retry_cap'
  | 'shopify_full_sync_tenant_busy'

export type SyncPlan = {
  full_history_window: FullHistoryWindow
  last_sync_status: SyncPlanStatus
  last_sync_started_at: string | null
  last_sync_completed_at: string | null
  last_sync_records_count: number | null
  last_sync_records_touched_count: number | null
  failed_attempts_since_last_success: number
  actual_min_created_at: string | null
  actual_max_created_at: string | null
  retry_after_seconds: number | null
  cooldown_reason: SyncCooldownReason | null
  current_job_id: string | null
}

export type PlatformConnection = {
  id: string
  platform: string
  shop_domain: string | null
  status: string
  connection_status: string
  last_synced_at: string | null
  last_error: string | null
  orders_watermark_at: string | null
  orders_backfill_completed_through: string | null
  sync_plan: SyncPlan | null
}

export type ShopifyOrdersPreviewResponse = {
  orders_written: number
  bytes_written: number
  file_name: string
  csv_file_name: string
  search_query_used: string | null
  truncated: boolean
}

/** POST /connectors/shopify/sync returns 202 with job id for polling GET /catalog/jobs/:id */
export type ShopifySyncEnqueueResponse = {
  job_id: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
}

/**
 * Typed errors raised by `useShopifyIntegration`'s sync mutation when the
 * API rejects via Guards A/B (409) or C/D (429). Each variant carries the
 * machine `detail` string from the API and, for cooldown / failed-retry,
 * the `Retry-After` seconds so the UI can render hours.
 */
export class ShopifySyncInProgressError extends Error {
  readonly kind = 'shopify_full_sync_in_progress' as const
  constructor() {
    super('shopify_full_sync_in_progress')
    this.name = 'ShopifySyncInProgressError'
  }
}

export class ShopifySyncTenantBusyError extends Error {
  readonly kind = 'shopify_full_sync_tenant_busy' as const
  constructor() {
    super('shopify_full_sync_tenant_busy')
    this.name = 'ShopifySyncTenantBusyError'
  }
}

export class ShopifySyncCooldownError extends Error {
  readonly kind = 'shopify_full_sync_cooldown' as const
  readonly retryAfterSeconds: number | null
  constructor(retryAfterSeconds: number | null) {
    super('shopify_full_sync_cooldown')
    this.name = 'ShopifySyncCooldownError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export class ShopifySyncFailedRetryCapError extends Error {
  readonly kind = 'shopify_full_sync_failed_retry_cap' as const
  readonly retryAfterSeconds: number | null
  constructor(retryAfterSeconds: number | null) {
    super('shopify_full_sync_failed_retry_cap')
    this.name = 'ShopifySyncFailedRetryCapError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export type ShopifySyncTypedError =
  | ShopifySyncInProgressError
  | ShopifySyncTenantBusyError
  | ShopifySyncCooldownError
  | ShopifySyncFailedRetryCapError
