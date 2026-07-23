import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  profitLabelKey,
  salesLabelKey,
  type SalesMetricBasis,
} from '@/lib/sales-metric-basis'
import type { MonthlyChartRow } from '@/pages/reports/monthly-revenue-chart'

export type HomeV2TrendMetricId =
  | 'net-sales'
  | 'net-profit'
  | 'contribution'
  | 'ebitda'
  | 'units'
  | 'orders'

export const HOME_V2_TREND_METRIC_IDS: HomeV2TrendMetricId[] = [
  'net-sales',
  'net-profit',
  'contribution',
  'ebitda',
  'units',
  'orders',
]

export type HomeV2TrendMetricContext = {
  salesMetricBasis: SalesMetricBasis
  productMode: boolean
  convertValue: (value: number) => number
  profitSparklineScale: number
  contributionSparklineScale: number
  ebitdaSparklineScale: number
}

export function isHomeV2TrendMetricCount(id: HomeV2TrendMetricId): boolean {
  return id === 'units' || id === 'orders'
}

export function homeV2TrendMetricOptions(
  ctx: HomeV2TrendMetricContext,
  t: (key: ShellStringKey) => string,
): { value: HomeV2TrendMetricId; label: string }[] {
  return HOME_V2_TREND_METRIC_IDS.filter((id) => {
    if (ctx.productMode && id === 'ebitda') return false
    return true
  }).map((id) => ({
    value: id,
    label: homeV2TrendMetricLabel(id, ctx, t),
  }))
}

export function resolveHomeV2TrendMetric(
  metric: HomeV2TrendMetricId,
  ctx: HomeV2TrendMetricContext,
  fallback: HomeV2TrendMetricId,
): HomeV2TrendMetricId {
  if (ctx.productMode && metric === 'ebitda') return fallback
  return metric
}

export function homeV2TrendMetricLabel(
  id: HomeV2TrendMetricId,
  ctx: HomeV2TrendMetricContext,
  t: (key: ShellStringKey) => string,
): string {
  switch (id) {
    case 'net-sales':
      return t(salesLabelKey(ctx.salesMetricBasis))
    case 'net-profit':
      return t(profitLabelKey(ctx.salesMetricBasis))
    case 'contribution':
      return t('reportsContributionMargin')
    case 'ebitda':
      return t('reportsEbitda')
    case 'units':
      return t('reportsUnits')
    case 'orders':
      return t('reportsOrders')
    default:
      return id
  }
}

export function homeV2TrendMetricValue(
  row: MonthlyChartRow,
  id: HomeV2TrendMetricId,
  ctx: HomeV2TrendMetricContext,
): number {
  switch (id) {
    case 'net-sales':
      return ctx.convertValue(
        ctx.salesMetricBasis === 'net' ? row.net_revenue : row.gross_revenue,
      )
    case 'net-profit':
      return ctx.convertValue(row.gross_profit * ctx.profitSparklineScale)
    case 'contribution':
      if (ctx.productMode) return ctx.convertValue(row.gross_profit)
      return ctx.convertValue(row.gross_profit * ctx.contributionSparklineScale)
    case 'ebitda':
      return ctx.convertValue(row.gross_profit * ctx.ebitdaSparklineScale)
    case 'units':
      return row.units_sold
    case 'orders':
      return row.order_count
    default:
      return 0
  }
}

export function formatHomeV2TrendMetricValue(
  id: HomeV2TrendMetricId,
  value: number,
  formatCurrency: (value: number) => string,
): string {
  if (isHomeV2TrendMetricCount(id)) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }
  return formatCurrency(value)
}
