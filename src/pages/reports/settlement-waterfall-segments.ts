import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { SettlementBreakdown } from '@/lib/types/reports'

import type { Segment } from './waterfall-chart'

export function buildSettlementWaterfallSegments(
  settlement: SettlementBreakdown,
  t: (key: ShellStringKey) => string,
): Segment[] {
  return [
    {
      name: t('settlementWfGross'),
      value: settlement.gross_revenue,
      isSubtotal: true,
      isNegative: false,
      positiveTone: 'gross',
    },
    {
      name: t('settlementWfDiscountsReturns'),
      value: settlement.discounts + settlement.returns,
      isSubtotal: false,
      isNegative: true,
      stackedParts: [
        { name: t('settlementWfDiscounts'), value: settlement.discounts, isNegative: true },
        { name: t('settlementWfReturns'), value: settlement.returns, isNegative: true },
      ],
    },
    {
      name: t('settlementWfNetSales'),
      value: settlement.net_revenue,
      isSubtotal: true,
      isNegative: false,
      positiveTone: 'net',
    },
    {
      name: t('settlementWfMarketplaceFees'),
      value: settlement.marketplace_fees,
      isSubtotal: false,
      isNegative: true,
    },
    {
      name: t('settlementWfShippingCharges'),
      value: settlement.shipping_charges,
      isSubtotal: false,
      isNegative: true,
    },
    {
      name: t('settlementWfTaxWithholdings'),
      value: settlement.tax_withholdings,
      isSubtotal: false,
      isNegative: true,
    },
    {
      name: t('settlementWfEstimatedPayout'),
      value: settlement.estimated_payout,
      isSubtotal: true,
      isNegative: settlement.estimated_payout < 0,
      positiveTone: 'payout',
    },
  ]
}
