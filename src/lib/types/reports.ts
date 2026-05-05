export type MonthlyRevenueMonthRow = {
  month_start: string
  gross_revenue: number
  net_revenue: number
  gross_profit: number
  gross_margin_pct: number
}

export type MonthlyRevenueSeriesResponse = {
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
  currency_mismatch_warning: boolean
  cogs_incomplete: boolean
  order_status_counts: Record<string, number>
}
