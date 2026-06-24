import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import type { KpiResponse, ProductKpiResponse } from '@/lib/types/reports'

export type SalesMetricBasis = 'net' | 'gross'

export function salesLabelKey(basis: SalesMetricBasis): ShellStringKey {
  return basis === 'net' ? 'reportsNetRevenue' : 'reportsGrossRevenue'
}

export function profitLabelKey(basis: SalesMetricBasis): ShellStringKey {
  return basis === 'net' ? 'reportsNetProfit' : 'reportsGrossProfit'
}

export function homeSalesHelpKey(basis: SalesMetricBasis): ShellStringKey {
  return basis === 'net' ? 'homeKpiNetSalesHelp' : 'homeKpiGrossSalesHelp'
}

export function productSalesHelpKey(basis: SalesMetricBasis): ShellStringKey {
  return basis === 'net' ? 'productsDetailKpiNetSalesHelp' : 'productsDetailKpiGrossSalesHelp'
}

export function productProfitHelpKey(basis: SalesMetricBasis): ShellStringKey {
  return basis === 'net'
    ? 'productsDetailKpiNetProfitHelp'
    : 'productsDetailKpiGrossProfitOnGrossSalesHelp'
}

export function profitHelpKey(basis: SalesMetricBasis): ShellStringKey {
  return basis === 'net' ? 'reportsKpiHelpNetProfit' : 'reportsKpiHelpGrossProfitOnGrossSales'
}

export function orderKpiSales(kpi: KpiResponse, basis: SalesMetricBasis): number {
  return basis === 'net' ? kpi.net_revenue : kpi.gross_revenue
}

export function orderKpiProfit(kpi: KpiResponse, basis: SalesMetricBasis): number {
  return basis === 'net' ? kpi.gross_profit : kpi.gross_revenue - kpi.cogs
}

export function productKpiSales(kpi: ProductKpiResponse, basis: SalesMetricBasis): number {
  return basis === 'net' ? kpi.net_revenue : kpi.gross_revenue
}

export function productKpiProfit(kpi: ProductKpiResponse, basis: SalesMetricBasis): number {
  return basis === 'net' ? kpi.gross_profit : kpi.gross_profit_on_gross
}

export function productDetailSalesValue(detail: ProductDetailApi, basis: SalesMetricBasis): number {
  return basis === 'net' ? detail.period_net_sales : detail.period_gross_sales
}

export function productDetailProfitValue(detail: ProductDetailApi, basis: SalesMetricBasis): number {
  return basis === 'net' ? detail.gross_profit : detail.period_gross_profit
}
