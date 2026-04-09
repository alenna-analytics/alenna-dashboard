export type KpiValues = {
  gross_revenue: string
  net_revenue: string
  gross_profit: string
  disbursement: string
  order_count: number
  units_sold: number
  margin_pct: string
  avg_order_value: string
  cogs: string
  total_cogs: string
  channel_commission: string
  shipping_cost: string
  ads_spend: string
  ebitda: string
}

export type DeltaValue = {
  current: string
  previous: string
  change_pct: string | null
}

export type SummaryResponse = {
  current: KpiValues
  previous: KpiValues
  deltas: Record<string, DeltaValue>
}

export type PlatformKpi = {
  platform: string
  net_revenue: string
  gross_profit: string
  order_count: number
  units_sold: number
}

export type DailySeriesPoint = {
  period_start: string
  gross_revenue: string
  net_revenue: string
  gross_profit: string
  disbursement: string
  order_count: number
  units_sold: number
  margin_pct: string
  cogs: string
  channel_commission: string
  shipping_cost: string
  ads_spend: string
  ebitda: string
  by_platform: PlatformKpi[] | null
}

export type DailySeriesResponse = {
  granularity: string
  series: DailySeriesPoint[]
}

export type ProductSales = {
  product_id: string
  title: string
  internal_sku: string | null
  revenue_by_platform: Record<string, string>
  units_by_platform: Record<string, number>
  total_revenue: string
  total_units: number
}

export type TopProductsResponse = {
  products: ProductSales[]
}

export type ProductInsight = {
  product_id: string
  title: string
  internal_sku: string | null
  revenue_by_platform: Record<string, string>
  units_by_platform: Record<string, number>
  total_revenue: string
  total_units: number
  cogs_total: string
  margin_pct: string | null
  unit_cost: string
  cogs_by_platform: Record<string, string>
  fees_by_platform: Record<string, string>
  lowest_unit_cost: string
}

export type ProductCostEditorRow = {
  product_id: string
  title: string
  original_cost: string
  current_cost: string
  total_units: number
  cogs_original: string
  cogs_current: string
  delta_cogs: string
}

export type ProductsInsightsResponse = {
  channels: string[]
  top_products: ProductInsight[]
  top_margin: ProductInsight[]
  bottom_margin: ProductInsight[]
  heatmap: ProductInsight[]
  sku_rows: ProductInsight[]
  cost_editor: ProductCostEditorRow[]
}

export type ProductCostUpdateItem = {
  product_id: string
  cost: number
}

export type ProductCostUpdateRequest = {
  items: ProductCostUpdateItem[]
}

export type ProductCostUpdateResponse = {
  updated: number
}

export type PaginationMeta = {
  page: number
  page_size: number
  total: number
}

export type ProductsSkuTableResponse = {
  items: ProductInsight[]
  pagination: PaginationMeta
}

export type ProductsCostEditorResponse = {
  items: ProductCostEditorRow[]
  pagination: PaginationMeta
}

export type ProjectionPoint = {
  week_start: string
  value: string
}

export type ProjectionResponse = {
  historical: ProjectionPoint[]
  forecast: ProjectionPoint[]
  r_squared: number
  slope: number
  intercept: number
  has_forecast: boolean
}

export type AnalyticsFilters = {
  start_date: string
  end_date: string
  platform?: string[]
  granularity?: string
  limit?: number
  horizon_weeks?: number
  /** Repeated as `product_id` on the API query string. */
  product_ids?: string[]
}

export type ProductCandidate = {
  product_id: string
  title: string
  internal_sku: string | null
}

export type ProductCatalogResponse = {
  items: ProductCandidate[]
}

export type ReportsErLine = {
  label: string
  value: string
  kind: string
  unit: '$' | '%'
}

export type ReportsChannelBreakdown = {
  channel: string
  lines: ReportsErLine[]
}

export type ReportsExpenseCategory = {
  category: string
  amount: string
}

export type ReportsMonthlyPoint = {
  period_start: string
  net_revenue: string
  gross_profit: string
  expenses: string
  ebitda: string
  ebitda_margin_pct: string
}

export type ReportsStatementResponse = {
  gross_revenue: string
  net_revenue: string
  gross_profit: string
  cogs: string
  channel_commission: string
  shipping_cost: string
  ads_spend: string
  platform_variable_costs: string
  gross_margin_pct: string
  operating_expenses: string
  ebitda: string
  ebitda_margin_pct: string
  statement_lines: ReportsErLine[]
  channels: ReportsChannelBreakdown[]
  expense_categories: ReportsExpenseCategory[]
  monthly: ReportsMonthlyPoint[]
}

export type SalesBrandPoint = {
  brand: string
  net_revenue: string
}

export type SalesBrandsResponse = {
  items: SalesBrandPoint[]
  pagination: PaginationMeta
}

export type SalesDetailedRow = {
  period_start: string
  channel: string
  gross_revenue: string
  net_revenue: string
  order_count: number
  units_sold: number
  gross_profit: string
  margin_pct: string
}

export type SalesDetailedTableResponse = {
  items: SalesDetailedRow[]
  pagination: PaginationMeta
}

export type CatalogProduct = {
  id: string
  title: string
  internal_sku: string | null
  brand: string | null
  cost: number | null
  currency: string | null
  active: boolean
  image_url: string | null
  listing_count: number
}

export type CatalogProductsResponse = {
  items: CatalogProduct[]
  page: number
  page_size: number
  total: number
}

export type ProductListing = {
  id: string
  platform: string
  platform_sku: string
  platform_title: string | null
  active: boolean
  currency: string | null
  sellout_price: number | null
}

export type CatalogProductDetailResponse = {
  id: string
  title: string
  internal_sku: string | null
  brand: string | null
  cost: number | null
  currency: string | null
  active: boolean
  image_url: string | null
  listings: ProductListing[]
}

export type CatalogProductPatchBody = {
  image_url: string | null
}

export type CatalogProductPatchResponse = {
  ok: boolean
}

export type UnmappedGroup = {
  platform: string
  sku_key: string
  line_title: string
  line_count: number
  total_revenue: string
  total_units: number
  first_order_date: string | null
  last_order_date: string | null
  line_item_ids: string[]
}

export type UnmappedLinesResponse = {
  items: UnmappedGroup[]
  page: number
  page_size: number
  total: number
}

export type CatalogAssignBody = {
  product_id: string
  platform: string
  platform_sku: string
  line_title?: string | null
  line_item_ids?: string[] | null
}

export type CatalogAssignResponse = {
  listings_upserted: number
  lines_updated: number
}
