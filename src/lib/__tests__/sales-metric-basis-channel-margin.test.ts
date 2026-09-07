import { describe, expect, it } from 'vitest'

import {
  isHomeChannelFilterActive,
  orderKpiChannelMargin,
} from '@/lib/sales-metric-basis'
import type { KpiResponse } from '@/lib/types/reports'
import { zeroSettlementBreakdown } from '@/lib/settlement-utils'

function kpi(partial: Partial<KpiResponse>): KpiResponse {
  return {
    gross_revenue: 0,
    discounts: 0,
    returns: 0,
    referral_commissions: 0,
    shipping: 0,
    taxes: 0,
    per_transaction_fees: 0,
    net_revenue: 0,
    cogs: 0,
    gross_profit: 0,
    gross_margin_pct: 0,
    platform_fees_total: 0,
    merchant_shipping_cost: 0,
    ads_spend: 0,
    fixed_operating_expenses: 0,
    contribution_margin: 0,
    contribution_margin_pct: 0,
    ebitda: 0,
    ebitda_margin_pct: 0,
    units_sold: 0,
    order_count: 0,
    currency: 'MXN',
    cogs_incomplete: false,
    order_status_counts: {},
    settlement: zeroSettlementBreakdown(),
    ...partial,
  }
}

describe('orderKpiChannelMargin', () => {
  it('subtracts platform fees and merchant shipping from gross profit', () => {
    expect(
      orderKpiChannelMargin(
        kpi({
          gross_profit: 1000,
          platform_fees_total: 120,
          merchant_shipping_cost: 30,
        }),
      ),
    ).toBe(850)
  })
})

describe('isHomeChannelFilterActive', () => {
  it('is inactive when no connections are selected (all channels)', () => {
    expect(isHomeChannelFilterActive([])).toBe(false)
  })

  it('is active when the user selected at least one connection', () => {
    expect(isHomeChannelFilterActive(['conn-1'])).toBe(true)
  })
})
