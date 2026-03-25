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
  product_id?: string
}

export type ProductCandidate = {
  product_id: string
  title: string
  internal_sku: string | null
}

export type ProductCatalogResponse = {
  items: ProductCandidate[]
}
