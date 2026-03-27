export type PlatformConnection = {
  id: string
  platform: string
  shop_domain: string | null
  status: string
  connection_status: string
  last_synced_at: string | null
  last_error: string | null
  sync_state: Record<string, unknown> | null
}

export type ShopifySyncResponse = {
  records_synced: number
  search_query_used: string | null
  min_order_date: string | null
  max_order_date: string | null
}
