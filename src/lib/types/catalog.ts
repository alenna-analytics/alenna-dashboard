export type StockAlertLevel = 'none' | 'low' | 'out'

export type StockAlertListingSummaryApi = {
  listing_id: string
  platform: string
  stock_alert: StockAlertLevel
  stock_quantity: number | null
  prev_month_units_sold: number
}

export type ProductListingApi = {
  id: string
  platform: string
  platform_sku: string
  platform_title: string | null
  platform_price: number | null
  platform_fee_pct: number | null
  currency: string | null
  active: boolean
  has_orders: boolean
  period_sales: number
  period_orders: number
  period_units_sold: number
  velocity_units_per_day_90d: number | null
  inventory_days: number | null
  stock_quantity: number | null
  stock_observed_at: string | null
  platform_synced_at: string | null
  prev_month_units_sold: number
  stock_alert: StockAlertLevel
}

export type ProductListingPriceSegmentApi = {
  listing_id: string
  platform: string
  platform_sku: string
  variant_label?: string | null
  currency: string
  effective_from: string
  effective_to: string | null
  price: number
}

export type ProductLifecycleStatus = 'active' | 'inactive' | 'archived' | 'deleted'

export type ProductVariantSummaryApi = {
  id: string
  internal_sku: string | null
  title: string
  variant_label: string | null
  image_url: string | null
  listing_count: number
  platforms: string[]
  stock_quantity: number | null
  stock_alert: StockAlertLevel
  cost: number | null
  currency: string | null
  cost_missing: boolean
  period_sales: number
  period_orders: number
  period_units_sold: number
  velocity_units_per_day_90d: number | null
  inventory_days: number | null
}

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
  variant_count: number
  stock_quantity: number | null
  stock_alert: StockAlertLevel
  cost_missing: boolean
  created_at: string
  updated_at: string
}

export type ProductStockAlertCountsApi = {
  low_count: number
  out_count: number
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
  entry_method?: string
  components?: Record<string, unknown> | null
}

export type ComponentAmountMode = 'fixed' | 'percent'

export type ComponentAmountApi = {
  mode: ComponentAmountMode
  value: number
}

export type ProductCostBreakdownApi = {
  supplier_price: number
  freight: ComponentAmountApi
  duties: ComponentAmountApi
  packaging_value: number
  computed_total: number
}

export type ProductWeeklyNetSalesPointApi = {
  week_start: string
  gross_revenue: number
}

export type ProductPlatformPeriodApi = {
  platform: string
  gross_sales: number
  net_sales: number
  gross_units_sold: number
  net_units_sold: number
  sales: number
  units_sold: number
}

export type ProductDetailApi = {
  id: string
  internal_sku: string | null
  period_gross_units_sold: number
  period_net_units_sold: number
  period_units_sold: number
  period_cogs: number
  period_gross_sales: number
  period_net_sales: number
  period_sales: number
  period_gross_profit: number
  period_orders: number
  period_start: string | null
  period_end: string | null
  gross_profit: number
  gross_margin_pct: number
  velocity_units_per_day_90d: number | null
  consolidated_stock_quantity: number | null
  inventory_days: number | null
  velocity_window_days: number
  period_by_platform: ProductPlatformPeriodApi[]
  weekly_net_sales: ProductWeeklyNetSalesPointApi[]
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
  variants: ProductVariantSummaryApi[]
  variant_count: number
  variant_label: string | null
  parent_product_id: string | null
  parent_title: string | null
  stock_alert_summary: StockAlertListingSummaryApi[]
  cost_history: ProductCostHistorySegmentApi[]
  listing_price_history: ProductListingPriceSegmentApi[]
  cost_breakdown?: ProductCostBreakdownApi | null
}

export type CatalogJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export type CatalogJobKind =
  | 'cogs_backfill'
  | 'product_import'
  | 'platform_sync'
  | 'listing_price_history_backfill'

export type CatalogJobApi = {
  id: string
  kind: CatalogJobKind
  status: CatalogJobStatus
  progress: Record<string, unknown> | null
  error_message: string | null
  error_code: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
  records_synced?: number | null
  catalog_products_upserted?: number | null
  min_order_date?: string | null
  max_order_date?: string | null
  created_by_user_id?: string | null
}
