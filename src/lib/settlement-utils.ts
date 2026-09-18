import type { ProductSettlementApi } from '@/lib/types/catalog'
import type { PlatformCancelCosts, SettlementBreakdown } from '@/lib/types/reports'

export function zeroPlatformCancelCosts(): PlatformCancelCosts {
  return {
    merchandise_gross: 0,
    merchandise_annulled: 0,
    marketplace_fees: 0,
    shipping_charges: 0,
    tax_withholdings: 0,
    total: 0,
  }
}

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
    platform_cancel_costs: zeroPlatformCancelCosts(),
  }
}

export type SettlementWaterfallLine = {
  key: string
  labelKey: string
  value: number
  kind: 'line' | 'subtotal' | 'total'
  isDeduction?: boolean
}

export function settlementHasPlatformCancelCosts(
  settlement: SettlementBreakdown | ProductSettlementApi,
): boolean {
  const c = settlement.platform_cancel_costs
  if (!c) return false
  return c.total !== 0 || c.shipping_charges !== 0 || c.merchandise_gross !== 0
}

export function platformCancelCostWaterfallLines(
  costs: PlatformCancelCosts,
): SettlementWaterfallLine[] {
  return [
    {
      key: 'cancel_merch',
      labelKey: 'settlementCancelCostMerchandise',
      value: costs.merchandise_gross,
      kind: 'line',
    },
    {
      key: 'cancel_annul',
      labelKey: 'settlementCancelCostAnnulled',
      value: costs.merchandise_annulled,
      kind: 'line',
      isDeduction: true,
    },
    {
      key: 'cancel_fees',
      labelKey: 'settlementCancelCostFees',
      value: costs.marketplace_fees,
      kind: 'line',
      isDeduction: true,
    },
    {
      key: 'cancel_shipping',
      labelKey: 'settlementCancelCostShipping',
      value: costs.shipping_charges,
      kind: 'line',
      isDeduction: true,
    },
    {
      key: 'cancel_tax',
      labelKey: 'settlementCancelCostTax',
      value: costs.tax_withholdings,
      kind: 'line',
      isDeduction: true,
    },
    {
      key: 'cancel_total',
      labelKey: 'settlementCancelCostTotal',
      value: costs.total,
      kind: 'total',
    },
  ]
}

export function settlementWaterfallLines(
  settlement: SettlementBreakdown | ProductSettlementApi,
  options?: { includeTaxWithholdings?: boolean },
): SettlementWaterfallLine[] {
  const includeTax = options?.includeTaxWithholdings ?? true
  const lines: SettlementWaterfallLine[] = [
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
  ]
  if (includeTax) {
    lines.push({
      key: 'tax',
      labelKey: 'settlementWfTaxWithholdings',
      value: settlement.tax_withholdings,
      kind: 'line',
      isDeduction: true,
    })
  }
  lines.push({
    key: 'payout',
    labelKey: 'settlementWfEstimatedPayout',
    value: settlement.estimated_payout,
    kind: 'total',
  })
  return lines
}
