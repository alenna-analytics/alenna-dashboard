export type IntegrationPlatformRow = {
  slug: string
  name: string
  is_available: boolean
  sort_order: number
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
}

export type ShopifyOrdersPreviewResponse = {
  orders_written: number
  bytes_written: number
  file_name: string
  csv_file_name: string
  search_query_used: string | null
  truncated: boolean
}
