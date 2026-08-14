import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi, ProductSettlementApi } from '@/lib/types/catalog'
import type { Segment } from '@/pages/reports/waterfall-chart'

export type ProductPnlWaterfallSource = {
  grossSales: number
  netSales: number
  cogs: number
  grossProfit: number
  contributionMargin: number
  discounts: number
  returns: number
  marketplaceFees: number
  shippingCharges: number
}

export function productPnlWaterfallSourceFromDetail(
  detail: ProductDetailApi,
): ProductPnlWaterfallSource {
  return productPnlWaterfallSourceFromPeriod(
    {
      period_gross_sales: detail.period_gross_sales,
      period_net_sales: detail.period_net_sales,
      period_cogs: detail.period_cogs,
      gross_profit: detail.gross_profit,
      contribution_margin: detail.contribution_margin,
    },
    detail.period_settlement,
  )
}

export function productPnlWaterfallSourceFromPeriod(
  period: {
    period_gross_sales: number
    period_net_sales: number
    period_cogs: number
    gross_profit: number
    contribution_margin: number
  },
  settlement: ProductSettlementApi | null | undefined,
): ProductPnlWaterfallSource {
  const discounts = settlement?.discounts ?? 0
  const returns = settlement?.returns ?? 0
  const impliedDeductions = Math.max(0, period.period_gross_sales - period.period_net_sales)
  const useSettlementDeductions = discounts + returns > 0
  return {
    grossSales: period.period_gross_sales,
    netSales: period.period_net_sales,
    cogs: period.period_cogs,
    grossProfit: period.gross_profit,
    contributionMargin: period.contribution_margin,
    discounts: useSettlementDeductions ? discounts : impliedDeductions,
    returns: useSettlementDeductions ? returns : 0,
    marketplaceFees: settlement?.marketplace_fees ?? 0,
    shippingCharges: settlement?.shipping_charges ?? 0,
  }
}

export function buildProductPnlWaterfallSegments(
  source: ProductPnlWaterfallSource,
  t: (key: ShellStringKey) => string,
): Segment[] {
  const deductionParts = [
    { name: t('reportsWfDiscounts'), value: source.discounts, isNegative: true },
    { name: t('reportsWfReturns'), value: source.returns, isNegative: true },
  ].filter((part) => part.value !== 0)
  const deductionTotal = source.discounts + source.returns

  return [
    {
      name: t('reportsWfGrossRevenue'),
      value: source.grossSales,
      isSubtotal: true,
      isNegative: false,
      positiveTone: 'gross',
    },
    {
      name: t('reportsWfDiscountsReturns'),
      value: deductionTotal,
      isSubtotal: false,
      isNegative: true,
      stackedParts: deductionParts.length > 1 ? deductionParts : undefined,
    },
    {
      name: t('reportsWfNetRevenue'),
      value: source.netSales,
      isSubtotal: true,
      isNegative: false,
      positiveTone: 'net',
    },
    {
      name: t('reportsWfCogs'),
      value: source.cogs,
      isSubtotal: false,
      isNegative: true,
    },
    {
      name: t('reportsWfGrossProfit'),
      value: source.grossProfit,
      isSubtotal: true,
      isNegative: false,
      positiveTone: 'grossProfit',
    },
    {
      name: t('reportsKpiPlatformFees'),
      value: source.marketplaceFees,
      isSubtotal: false,
      isNegative: true,
    },
    {
      name: t('reportsKpiFulfillmentCost'),
      value: source.shippingCharges,
      isSubtotal: false,
      isNegative: true,
    },
    {
      name: t('reportsNetProfit'),
      value: source.contributionMargin,
      isSubtotal: true,
      isNegative: source.contributionMargin < 0,
      positiveTone: 'contribution',
    },
  ]
}
