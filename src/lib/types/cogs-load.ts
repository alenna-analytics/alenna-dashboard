import type { ProductCostBulkRowApi } from '@/lib/types/catalog'

export type CogsBulkLoadStatus = 'draft' | 'applying' | 'applied' | 'apply_failed'

export type CogsBulkLoadSummaryApi = {
  id: string
  status: CogsBulkLoadStatus
  created_by_user_id: string | null
  created_by_name: string | null
  applied_by_user_id: string | null
  applied_by_name: string | null
  applied_at: string | null
  apply_mode: 'forward' | 'backfill' | null
  effective_from: string | null
  effective_to: string | null
  source_load_id: string | null
  product_count: number
  applied_product_count: number | null
  backfill_job_ids: string[]
  error_message: string | null
  created_at: string
  updated_at: string
}

export type CogsBulkLoadItemApi = {
  id: string
  product_id: string
  parent_product_id: string | null
  parent_title: string
  title: string
  variant_label: string | null
  internal_sku: string | null
  supplier_price: number | null
  freight_value: number | null
  packaging_value: number | null
  computed_total: number | null
  sort_order: number
}

export type CogsBulkLoadDetailApi = {
  load: CogsBulkLoadSummaryApi
  items: CogsBulkLoadItemApi[]
  base_currency: string
}

export type CogsBulkLoadListResponse = {
  items: CogsBulkLoadSummaryApi[]
  total: number
  limit: number
  offset: number
}

export type CogsBulkLoadFilterMatchesResponse = {
  items: ProductCostBulkRowApi[]
  total: number
  base_currency: string
}

export type CogsBulkLoadApplyResponse = {
  load: CogsBulkLoadSummaryApi
  saved_count: number
  backfill_jobs: { product_id: string; job_id: string; status: string }[]
}

export type CogsBulkLoadAddByFilterBody = {
  add_all: boolean
  q?: string
  limit?: number
  offset?: number
  status?: string[]
  platform?: string[]
  stock_alert?: string[]
  cost_missing?: boolean
}
