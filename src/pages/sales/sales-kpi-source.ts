import type { KpiResponse, ProductKpiResponse } from '@/lib/types/reports'

export type SalesKpiSource = {
  gross_revenue: number
  net_revenue: number
  discounts?: number
  returns?: number
  units_sold: number
  order_count: number
}

export function toSalesKpiSource(kpi: KpiResponse): SalesKpiSource {
  return {
    gross_revenue: kpi.gross_revenue,
    net_revenue: kpi.net_revenue,
    discounts: kpi.discounts,
    returns: kpi.returns,
    units_sold: kpi.units_sold,
    order_count: kpi.order_count,
  }
}

export function productToSalesKpiSource(kpi: ProductKpiResponse): SalesKpiSource {
  return {
    gross_revenue: kpi.gross_revenue,
    net_revenue: kpi.net_revenue,
    units_sold: kpi.units_sold,
    order_count: kpi.order_count,
  }
}
