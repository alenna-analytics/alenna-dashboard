export type AlertSeverity = 'critical' | 'low' | 'informational'

export type AlertSection = 'active' | 'postponed'

export type AlertPostponeDuration = '1h' | '1d' | '1w'

export type AlertsSummaryApi = {
  critical_count: number
  low_count: number
  informational_count: number
  postponed_count: number
  total_active: number
}

export type AlertItemApi = {
  id: string
  alert_type: string
  severity: AlertSeverity
  title: string
  triggered_at: string
  postponed_until: string | null
  platform_connection_id: string | null
  entity_type: string
  entity_id: string
  product_id: string | null
  platform: string | null
  platform_sku: string | null
  payload: Record<string, unknown>
}

export type AlertsListApi = {
  items: AlertItemApi[]
  total: number
  limit: number
  offset: number
}
