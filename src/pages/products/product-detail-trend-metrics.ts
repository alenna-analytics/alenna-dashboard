import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi, ProductPlatformPeriodApi } from '@/lib/types/catalog'
import type { MonthlyChartRow } from '@/pages/reports/monthly-revenue-chart'

export type ProductDetailTrendMetricId =
  | 'gross-sales'
  | 'net-sales'
  | 'gross-profit'
  | 'net-profit'
  | 'units'
  | 'orders'
  | 'contribution-margin-pct'
  | 'inventory-days'

export const PRODUCT_DETAIL_TREND_METRIC_IDS: ProductDetailTrendMetricId[] = [
  'gross-sales',
  'net-sales',
  'gross-profit',
  'net-profit',
  'units',
  'orders',
  'contribution-margin-pct',
  'inventory-days',
]

export const PRODUCT_DETAIL_METRIC_COLORS: Record<ProductDetailTrendMetricId, string> = {
  'gross-sales': 'var(--chart-3)',
  'net-sales': 'var(--country-green-base)',
  'gross-profit': 'var(--chart-monthly-gross-bar)',
  'net-profit': '#6366f1',
  units: '#0ea5e9',
  orders: '#f59e0b',
  'contribution-margin-pct': '#ec4899',
  'inventory-days': '#64748b',
}

export type ProductDetailPeriodView = Pick<
  ProductDetailApi,
  | 'period_gross_sales'
  | 'period_net_sales'
  | 'period_gross_profit'
  | 'gross_profit'
  | 'contribution_margin'
  | 'contribution_margin_pct'
  | 'gross_margin_pct'
  | 'cm_incomplete'
  | 'period_gross_units_sold'
  | 'period_units_sold'
  | 'period_orders'
  | 'inventory_days'
>

export function isProductDetailTrendMetricChartable(id: ProductDetailTrendMetricId): boolean {
  return id !== 'inventory-days' && id !== 'net-profit' && id !== 'contribution-margin-pct'
}

export function isProductDetailTrendMetricCount(id: ProductDetailTrendMetricId): boolean {
  return id === 'units' || id === 'orders'
}

export function isProductDetailTrendMetricPct(id: ProductDetailTrendMetricId): boolean {
  return id === 'contribution-margin-pct'
}

export function productDetailTrendMetricLabel(
  id: ProductDetailTrendMetricId,
  t: (key: ShellStringKey) => string,
): string {
  switch (id) {
    case 'gross-sales':
      return t('reportsGrossRevenue')
    case 'net-sales':
      return t('reportsNetRevenue')
    case 'gross-profit':
      return t('productsDetailKpiGrossProfit')
    case 'net-profit':
      return t('reportsNetProfit')
    case 'units':
      return t('productsDetailKpiUnitsSold')
    case 'orders':
      return t('productsDetailKpiOrders')
    case 'contribution-margin-pct':
      return t('productsDetailKpiContributionMarginPct')
    case 'inventory-days':
      return t('productsDetailKpiInventoryDays')
    default:
      return id
  }
}

export function productDetailTrendMetricHelp(
  id: ProductDetailTrendMetricId,
  t: (key: ShellStringKey) => string,
): string | undefined {
  switch (id) {
    case 'gross-sales':
      return t('productsDetailKpiGrossSalesHelp')
    case 'net-sales':
      return t('productsDetailKpiNetSalesHelp')
    case 'gross-profit':
      return t('reportsKpiHelpGrossProfit')
    case 'net-profit':
      return t('reportsKpiHelpContributionMargin')
    case 'orders':
      return t('productsDetailKpiOrdersHelp')
    case 'units':
      return t('productsDetailKpiUnitsSoldHelp')
    case 'contribution-margin-pct':
      return t('productsDetailKpiContributionMarginPctHelp')
    case 'inventory-days':
      return t('productsDetailKpiInventoryDaysHelp')
    default:
      return undefined
  }
}

export function productDetailTrendSeriesValue(
  row: MonthlyChartRow,
  id: ProductDetailTrendMetricId,
): number {
  switch (id) {
    case 'gross-sales':
      return row.gross_revenue
    case 'net-sales':
      return row.net_revenue
    case 'gross-profit':
      return row.gross_profit
    case 'net-profit':
      return 0
    case 'units':
      return row.units_sold ?? 0
    case 'orders':
      return row.order_count ?? 0
    case 'contribution-margin-pct':
      return 0
    case 'inventory-days':
      return 0
    default:
      return 0
  }
}

export function productDetailTrendPeriodValue(
  detail: ProductDetailApi,
  id: ProductDetailTrendMetricId,
): number | null {
  return productDetailTrendPeriodValueFromFiltered(detail, id)
}

export function productDetailTrendPeriodValueFromFiltered(
  period: ProductDetailPeriodView,
  id: ProductDetailTrendMetricId,
): number | null {
  switch (id) {
    case 'gross-sales':
      return period.period_gross_sales
    case 'net-sales':
      return period.period_net_sales
    case 'gross-profit':
      return period.gross_profit
    case 'net-profit':
      return period.contribution_margin
    case 'units':
      return period.period_gross_units_sold ?? period.period_units_sold
    case 'orders':
      return period.period_orders
    case 'contribution-margin-pct':
      return Number(period.contribution_margin_pct)
    case 'inventory-days':
      return period.inventory_days
    default:
      return null
  }
}

export function formatProductDetailTrendMetricValue(
  id: ProductDetailTrendMetricId,
  value: number,
  formatMoney: (value: number) => string,
): string {
  if (isProductDetailTrendMetricPct(id)) {
    return `${value.toFixed(1)}%`
  }
  if (isProductDetailTrendMetricCount(id)) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }
  return formatMoney(value)
}

export function productDetailPlatformSalesValue(row: ProductPlatformPeriodApi): number {
  return row.gross_sales ?? row.sales
}

export function productDetailPlatformUnitsValue(row: ProductPlatformPeriodApi): number {
  return row.gross_units_sold ?? row.units_sold
}

export function toggleProductDetailTrendMetric(
  selected: ProductDetailTrendMetricId[],
  id: ProductDetailTrendMetricId,
): ProductDetailTrendMetricId[] {
  if (!isProductDetailTrendMetricChartable(id)) return selected
  if (selected.includes(id)) {
    const next = selected.filter((m) => m !== id)
    return next.length > 0 ? next : selected
  }
  if (selected.length >= 4) return [...selected.slice(1), id]
  return [...selected, id]
}
