import type { ProductSettlementApi } from '@/lib/types/catalog'
import type { SettlementBreakdown } from '@/lib/types/reports'

export function zeroSettlementBreakdown(): SettlementBreakdown {
  return {
    gross_revenue: 0,
    discounts: 0,
    returns: 0,
    net_revenue: 0,
    marketplace_fees: 0,
    shipping_charges: 0,
    tax_withholdings: 0,
    estimated_payout: 0,
    completeness: 'unavailable',
  }
}

export type SettlementWaterfallLine = {
  key: string
  labelKey: string
  value: number
  kind: 'line' | 'subtotal' | 'total'
  isDeduction?: boolean
}

export function settlementWaterfallLines(
  settlement: SettlementBreakdown | ProductSettlementApi,
): SettlementWaterfallLine[] {
  return [
    { key: 'gross', labelKey: 'settlementWfGross', value: settlement.gross_revenue, kind: 'line' },
    {
      key: 'discounts',
      labelKey: 'settlementWfDiscounts',
      value: settlement.discounts,
      kind: 'line',
      isDeduction: true,
    },
    {
      key: 'returns',
      labelKey: 'settlementWfReturns',
      value: settlement.returns,
      kind: 'line',
      isDeduction: true,
    },
    {
      key: 'net',
      labelKey: 'settlementWfNetSales',
      value: settlement.net_revenue,
      kind: 'subtotal',
    },
    {
      key: 'fees',
      labelKey: 'settlementWfMarketplaceFees',
      value: settlement.marketplace_fees,
      kind: 'line',
      isDeduction: true,
    },
    {
      key: 'shipping',
      labelKey: 'settlementWfShippingCharges',
      value: settlement.shipping_charges,
      kind: 'line',
      isDeduction: true,
    },
    {
      key: 'tax',
      labelKey: 'settlementWfTaxWithholdings',
      value: settlement.tax_withholdings,
      kind: 'line',
      isDeduction: true,
    },
    {
      key: 'payout',
      labelKey: 'settlementWfEstimatedPayout',
      value: settlement.estimated_payout,
      kind: 'total',
    },
  ]
}
