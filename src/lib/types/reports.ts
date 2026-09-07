export type RevenueSeriesGranularity = 'month' | 'week' | 'day'

export type MonthlyRevenueMonthRow = {
  month_start: string
  gross_revenue: number
  net_revenue: number
  gross_profit: number
  gross_margin_pct: number
  units_sold?: number
  order_count?: number
  contribution_margin?: number | null
}

export type MonthlyRevenueSeriesResponse = {
  granularity?: RevenueSeriesGranularity
  months: MonthlyRevenueMonthRow[]
}

export type SettlementBreakdown = {
  gross_revenue: number
  discounts: number
  returns: number
  net_revenue: number
  marketplace_fees: number
  shipping_charges: number
  tax_withholdings: number
  estimated_payout: number
  completeness: string
}

export type TaxesEstimatedSettingsEcho = {
  withholding_iva_pct: number
  withholding_isr_pct: number
  transferred_iva_pct: number
}

/** Liquidity estimates from tenant tax_settings — never feeds CM/EBITDA. */
export type TaxesEstimated = {
  withholding_isr: number
  withholding_iva: number
  withholding_total: number
  transferred_iva: number
  expected_net_cash: number
  base_amount: number
  base_field: string
  formula_version: string
  settings: TaxesEstimatedSettingsEcho
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
  /** Prefer API; older payloads omit → UI falls back to orderKpiChannelMargin. */
  channel_margin?: number
  channel_margin_pct?: number
  ebitda: number
  ebitda_margin_pct: number
  units_sold: number
  order_count: number
  total_order_items?: number | null
  currency: string
  cogs_incomplete: boolean
  order_status_counts: Record<string, number>
  settlement: SettlementBreakdown
  /** null/undefined when tax settings unset — do not invent zeros. */
  taxes_estimated?: TaxesEstimated | null
  kpi_source_completeness?: string | null
}

export type ProductKpiResponse = {
  gross_revenue: number
  net_revenue: number
  cogs: number
  gross_profit: number
  gross_profit_on_gross: number
  gross_margin_pct: number
  units_sold: number
  order_count: number
  currency: string
  settlement: SettlementBreakdown
}

export type TopProductRow = {
  product_id: string
  title: string
  image_url: string | null
  internal_sku: string | null
  gross_revenue: number
  net_revenue: number
  units_sold: number
  order_count: number
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
  net_revenue: number
  gross_profit: number
  units_sold: number
}

export type ChannelKpiRow = {
  connection_id: string
  platform: string
  shop_domain: string | null
  gross_revenue: number
  discounts: number
  returns: number
  net_revenue: number
  cogs: number
  gross_profit: number
  platform_fees_total: number
  merchant_shipping_cost: number
  contribution_margin: number
  contribution_margin_pct: number
  units_sold: number
  order_count: number
  marketplace_fees: number
  shipping_charges: number
  tax_withholdings: number
  estimated_payout: number
  ads_spend?: number
  settlement_completeness: string
}

export type ChannelKpisResponse = {
  items: ChannelKpiRow[]
  currency: string
  tenant_fixed_operating_expenses: number | null
  tenant_ads_spend: number | null
  /** True when product_ids filter is active: fees not allocated; CM is not glossary CM. */
  cm_incomplete?: boolean
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
  cogs: number
  platform_fees_total: number
  contribution_margin: number
}

export type ChannelTimeSeriesResponse = {
  granularity: RevenueSeriesGranularity
  currency: string
  rows: ChannelTimeSeriesRow[]
  /** True when product_ids filter is active: fees not allocated; CM is not glossary CM. */
  cm_incomplete?: boolean
}
