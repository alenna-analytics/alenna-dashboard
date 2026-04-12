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
  operating_expenses: number
  net_profit: number
  units_sold: number
  order_count: number
  currency: string
  order_status_counts: Record<string, number>
}
