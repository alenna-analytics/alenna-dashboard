export type RevenueSeriesGranularity = 'month' | 'week' | 'day'

export type MonthlyRevenueMonthRow = {
  month_start: string
  gross_revenue: number
  net_revenue: number
  gross_profit: number
  gross_margin_pct: number
}

export type MonthlyRevenueSeriesResponse = {
  granularity?: RevenueSeriesGranularity
  months: MonthlyRevenueMonthRow[]
}

export type KpiResponse = {
  gross_revenue: number
  discounts: number
  returns: number
  referral_commissions: number
  shipping: number
  taxes: number
  per_transaction_fees: number
  net_revenue: number
  cogs: number
  gross_profit: number
  gross_margin_pct: number
  platform_fees_total: number
  merchant_shipping_cost: number
  ads_spend: number
  fixed_operating_expenses: number
  contribution_margin: number
  contribution_margin_pct: number
  ebitda: number
  ebitda_margin_pct: number
  units_sold: number
  order_count: number
  currency: string
  cogs_incomplete: boolean
  order_status_counts: Record<string, number>
}

export type ProductKpiResponse = {
  gross_revenue: number
  cogs: number
  gross_profit: number
  gross_margin_pct: number
  units_sold: number
  order_count: number
  currency: string
}

export type TopProductRow = {
  product_id: string
  title: string
  image_url: string | null
  internal_sku: string | null
  gross_revenue: number
  units_sold: number
  cogs: number
  gross_profit: number
  gross_margin_pct: number
}

export type TopProductsResponse = {
  items: TopProductRow[]
  currency: string
}

export type ChannelBreakdownRow = {
  connection_id: string
  shop_domain: string | null
  platform: string
  gross_revenue: number
  units_sold: number
}

export type ChannelBreakdownResponse = {
  items: ChannelBreakdownRow[]
  currency: string
}

export type ChannelTimeSeriesRow = {
  bucket_start: string
  connection_id: string
  shop_domain: string | null
  platform: string
  gross_revenue: number
  net_revenue: number
  gross_profit: number
}

export type ChannelTimeSeriesResponse = {
  granularity: RevenueSeriesGranularity
  currency: string
  rows: ChannelTimeSeriesRow[]
}
