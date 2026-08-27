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
  period_cogs: number
  period_gross_profit: number
  period_net_profit: number
  velocity_units_per_day_90d: number | null
  consolidated_stock_quantity: number | null
  inventory_days: number | null
}

export type ProductLinkGroupApi = {
  id: string
  title: string
  members: ProductLinkGroupMemberApi[]
  period_gross_units_sold: number
  period_net_units_sold: number
  period_gross_sales: number
  period_net_sales: number
  period_orders: number
  period_cogs: number
  period_gross_profit: number
  period_net_profit: number
  velocity_units_per_day_90d: number | null
  consolidated_stock_quantity: number | null
  inventory_days: number | null
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
