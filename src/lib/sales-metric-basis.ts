import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import type { KpiResponse, ProductKpiResponse } from '@/lib/types/reports'

export type SalesMetricBasis = 'net' | 'gross'

export function salesLabelKey(basis: SalesMetricBasis): ShellStringKey {
  return basis === 'net' ? 'reportsNetRevenue' : 'reportsGrossRevenue'
}

export function homeSalesHelpKey(basis: SalesMetricBasis): ShellStringKey {
  return basis === 'net' ? 'homeKpiNetSalesHelp' : 'homeKpiGrossSalesHelp'
}

export function productSalesHelpKey(basis: SalesMetricBasis): ShellStringKey {
  return basis === 'net' ? 'productsDetailKpiNetSalesHelp' : 'productsDetailKpiGrossSalesHelp'
}

export function productProfitHelpKey(basis: SalesMetricBasis): ShellStringKey {
  return basis === 'net'
    ? 'productsDetailKpiGrossProfitHelp'
    : 'productsDetailKpiGrossProfitOnGrossSalesHelp'
}

export function profitHelpKey(basis: SalesMetricBasis): ShellStringKey {
  return basis === 'net' ? 'reportsKpiHelpGrossProfit' : 'reportsKpiHelpGrossProfitOnGrossSales'
}

export function orderKpiSales(kpi: KpiResponse, basis: SalesMetricBasis): number {
  return basis === 'net' ? kpi.net_revenue : kpi.gross_revenue
}

export function orderKpiProfit(kpi: KpiResponse, basis: SalesMetricBasis): number {
  return basis === 'net' ? kpi.gross_profit : kpi.gross_revenue - kpi.cogs
}

export function productKpiSales(kpi: ProductKpiResponse): number {
  return kpi.gross_revenue
}

export function productKpiProfit(kpi: ProductKpiResponse, basis: SalesMetricBasis): number {
  return basis === 'net' ? kpi.gross_profit : kpi.gross_revenue - kpi.cogs
}

export function productDetailSalesValue(detail: ProductDetailApi): number {
  return detail.period_sales
}

export function productDetailProfitValue(detail: ProductDetailApi, basis: SalesMetricBasis): number {
  return basis === 'net' ? detail.gross_profit : detail.period_sales - detail.period_cogs
}
