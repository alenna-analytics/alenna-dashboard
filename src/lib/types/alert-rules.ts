export type AlertScopeType = 'product_listing' | 'product' | 'channel'

export type StockRuleApi = {
  id: string
  alert_type: string
  enabled: boolean
  out_of_stock_enabled: boolean
  velocity_pct: number
  template_slug: string | null
  template_name: string | null
  template_description: string | null
}

export type StockOverrideApi = {
  id: string
  alert_type: string
  scope_type: AlertScopeType
  scope_id: string | null
  platform_connection_id: string | null
  enabled: boolean
  out_of_stock_enabled: boolean
  velocity_pct: number
  scope_label: string
  created_at: string
  updated_at: string
}

export type StockOverrideListApi = {
  items: StockOverrideApi[]
}

export type CreateStockOverrideBody = {
  alert_type: 'stock'
  scope_type: AlertScopeType
  scope_id?: string | null
  platform_connection_id?: string | null
  enabled: boolean
  out_of_stock_enabled: boolean
  velocity_pct: number
}

export type PatchStockRuleBody = {
  enabled?: boolean
  out_of_stock_enabled?: boolean
  velocity_pct?: number
}

export type PatchStockOverrideBody = {
  enabled?: boolean
  out_of_stock_enabled?: boolean
  velocity_pct?: number
}
