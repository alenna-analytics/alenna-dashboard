import { describe, expect, it } from 'vitest'

import type { SettlementBreakdown } from '@/lib/types/reports'
import { settlementWaterfallLines } from '@/lib/settlement-utils'
import { buildSettlementWaterfallSegments } from '@/pages/reports/settlement-waterfall-segments'

const t = (key: string) => key

const meliSettlement: SettlementBreakdown = {
  gross_revenue: 1000,
  discounts: 100,
  returns: 50,
  net_revenue: 850,
  marketplace_fees: 85,
  shipping_charges: 30,
  tax_withholdings: 16,
  estimated_payout: 719,
  completeness: 'full',
}

describe('settlementWaterfallLines', () => {
  it('includes gross through payout bridge', () => {
    const lines = settlementWaterfallLines(meliSettlement)
    expect(lines.map((l) => l.key)).toEqual([
      'gross',
      'discounts',
      'returns',
      'net',
      'fees',
      'shipping',
      'tax',
      'payout',
    ])
    expect(lines.find((l) => l.key === 'payout')?.value).toBe(719)
  })
})

describe('buildSettlementWaterfallSegments', () => {
  it('reconciles Meli payout with net minus deductions', () => {
    const segments = buildSettlementWaterfallSegments(meliSettlement, t)
    const payout = segments[segments.length - 1]?.value
    const derived =
      meliSettlement.net_revenue -
      meliSettlement.marketplace_fees -
      meliSettlement.shipping_charges -
      meliSettlement.tax_withholdings
    expect(payout).toBe(meliSettlement.estimated_payout)
    expect(derived).toBe(meliSettlement.estimated_payout)
  })
})
