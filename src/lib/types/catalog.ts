export type ProductListingApi = {
  id: string
  platform: string
  platform_sku: string
  platform_title: string | null
  platform_price: number | null
  platform_fee_pct: number | null
  currency: string | null
  active: boolean
}

export type ProductLifecycleStatus = 'active' | 'inactive' | 'archived' | 'deleted'

export type ProductSummaryApi = {
  id: string
  internal_sku: string | null
  title: string
  brand: string | null
  cost: number | null
  currency: string | null
  image_url: string | null
  active: boolean
  status: ProductLifecycleStatus | string
  platforms: string[]
  listing_count: number
  cost_missing: boolean
  created_at: string
  updated_at: string
}

export type ProductListResponse = {
  items: ProductSummaryApi[]
  total: number
  limit: number
  offset: number
  base_currency: string
  sort_by?: string
  sort_dir?: string
}

export type ProductCostHistorySegmentApi = {
  id: string
  cost: number
  currency: string
  effective_from: string
  effective_to: string | null
}

export type ProductDetailApi = {
  id: string
  internal_sku: string | null
  title: string
  brand: string | null
  cost: number | null
  currency: string | null
  image_url: string | null
  active: boolean
  status: ProductLifecycleStatus | string
  cost_missing: boolean
  base_currency: string
  has_listing_currency_mismatch: boolean
  created_at: string
  updated_at: string
  listings: ProductListingApi[]
  cost_history: ProductCostHistorySegmentApi[]
}

export type CatalogJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export type CatalogJobApi = {
  id: string
  kind: 'cogs_backfill' | 'product_import' | 'platform_sync'
  status: CatalogJobStatus
  progress: Record<string, unknown> | null
  error_message: string | null
  error_code: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}
