import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { KpiResponse } from '@/lib/types/reports'

import type { Segment } from './waterfall-chart'

export function buildWaterfallSegments(
  kpi: KpiResponse,
  t: (key: ShellStringKey) => string,
): Segment[] {
  return [
    { name: t('reportsWfGrossRevenue'), value: kpi.gross_revenue, isSubtotal: true, isNegative: false },
    {
      name: t('reportsWfDiscountsReturns'),
      value: kpi.discounts + kpi.returns,
      isSubtotal: false,
      isNegative: true,
      stackedParts: [
        { name: t('reportsWfDiscounts'), value: kpi.discounts, isNegative: true },
        { name: t('reportsWfReturns'), value: kpi.returns, isNegative: true },
      ],
    },
    { name: t('reportsWfNetRevenue'), value: kpi.net_revenue, isSubtotal: true, isNegative: false },
    { name: t('reportsWfCogs'), value: kpi.cogs, isSubtotal: false, isNegative: true },
    { name: t('reportsWfGrossProfit'), value: kpi.gross_profit, isSubtotal: true, isNegative: false },
    { name: t('reportsWfCommissions'), value: kpi.platform_fees_total, isSubtotal: false, isNegative: true },
    { name: t('reportsWfShipping'), value: kpi.merchant_shipping_cost, isSubtotal: false, isNegative: true },
    { name: t('reportsWfAdsSpend'), value: kpi.ads_spend, isSubtotal: false, isNegative: true },
    {
      name: t('reportsWfContributionMargin'),
      value: kpi.contribution_margin,
      isSubtotal: true,
      isNegative: kpi.contribution_margin < 0,
    },
    { name: t('reportsWfOpex'), value: kpi.fixed_operating_expenses, isSubtotal: false, isNegative: true },
    { name: t('reportsWfEbitda'), value: kpi.ebitda, isSubtotal: true, isNegative: kpi.ebitda < 0 },
  ]
}
