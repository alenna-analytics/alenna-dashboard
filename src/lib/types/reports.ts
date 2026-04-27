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
  order_status_counts: Record<string, number>
}
