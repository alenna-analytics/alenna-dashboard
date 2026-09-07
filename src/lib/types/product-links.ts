export type ProductMatchKind = 'sku' | 'name'

export type ProductLinkSuggestionProductApi = {
  product_id: string
  title: string
  platform: string
  image_url: string | null
  platform_title: string | null
  platform_sku: string | null
}

export type ProductLinkSuggestionApi = {
  id: string
  score: number
  kind: ProductMatchKind
  status: 'pending' | 'accepted' | 'rejected' | 'superseded'
  product_a: ProductLinkSuggestionProductApi
  product_b: ProductLinkSuggestionProductApi
}

export type ProductLinkSuggestionsPageApi = {
  items: ProductLinkSuggestionApi[]
  total: number
  limit: number
  offset: number
  stale: boolean
  current_job_id: string | null
  last_ran_at: string | null
}

export type ProductLinkCandidateApi = {
  product_id: string
  title: string
  platform: string
  image_url: string | null
  platform_title: string | null
  platform_sku: string | null
  grouped: boolean
  listings_count: number
}

export type ProductLinkCandidatesPageApi = {
  items: ProductLinkCandidateApi[]
  total: number
  limit: number
  offset: number
}

export type ProductLinkGroupMemberApi = {
  product_id: string
  title: string
  platform: string
  image_url: string | null
  platform_title: string | null
  platform_sku: string | null
  variant_label: string | null
  cost: number | null
  listings_count: number
  stock_quantity: number | null
  platform_price: number | null
  matchable: boolean
  period_gross_units_sold: number
  period_net_units_sold: number
  period_gross_sales: number
  period_net_sales: number
  period_orders: number
}

export type ProductLinkGroupPlatformPeriodApi = {
  platform: string
  gross_sales: number
  net_sales: number
  gross_units_sold: number
  net_units_sold: number
  sales: number
  units_sold: number
}

export type ProductLinkGroupSettlementApi = {
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

export type ProductLinkGroupPlatformSettlementApi = ProductLinkGroupSettlementApi & {
  platform: string
}

export type ProductLinkGroupInventoryPlatformApi = {
  platform: string
  stock_quantity: number
  velocity_units_per_day_90d: number | null
  inventory_days: number | null
}

export type ProductLinkGroupApi = {
  id: string
  title: string
  members: ProductLinkGroupMemberApi[]
  period_gross_units_sold: number
  period_net_units_sold: number
  period_cogs: number
  period_gross_sales: number
  period_net_sales: number
  period_gross_profit: number
  period_orders: number
  gross_margin_pct: number
  contribution_margin: number
  contribution_margin_pct: number
  channel_margin: number
  channel_margin_pct: number
  cm_incomplete: boolean
  velocity_units_per_day_90d: number | null
  consolidated_stock_quantity: number | null
  inventory_days: number | null
  inventory_by_platform?: ProductLinkGroupInventoryPlatformApi[]
  period_by_platform: ProductLinkGroupPlatformPeriodApi[]
  period_settlement: ProductLinkGroupSettlementApi
  period_settlement_by_platform: ProductLinkGroupPlatformSettlementApi[]
  period_start: string | null
  period_end: string | null
  base_currency: string
}

export type ProductLinkGroupsPageApi = {
  items: ProductLinkGroupApi[]
  total: number
  limit: number
  offset: number
}
