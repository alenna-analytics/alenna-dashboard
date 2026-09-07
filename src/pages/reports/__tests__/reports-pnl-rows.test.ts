import { describe, expect, it } from 'vitest'

import type { KpiResponse, ProductKpiResponse } from '@/lib/types/reports'
import { zeroSettlementBreakdown } from '@/lib/settlement-utils'
import {
  buildProductPnlRows,
  buildTenantPnlRows,
  pctOfNetRevenue,
} from '@/pages/reports/reports-pnl-rows'

function baseKpi(overrides: Partial<KpiResponse> = {}): KpiResponse {
  return {
    gross_revenue: 1000,
    discounts: 50,
    returns: 50,
    referral_commissions: 40,
    shipping: 0,
    taxes: 0,
    per_transaction_fees: 10,
    net_revenue: 900,
    cogs: 300,
    gross_profit: 600,
    gross_margin_pct: 66.67,
    platform_fees_total: 50,
    merchant_shipping_cost: 20,
    ads_spend: 30,
    fixed_operating_expenses: 100,
    contribution_margin: 400,
    contribution_margin_pct: 44.44,
    channel_margin: 530,
    channel_margin_pct: 58.89,
    ebitda: 300,
    ebitda_margin_pct: 33.33,
    units_sold: 10,
    order_count: 5,
    currency: 'MXN',
    cogs_incomplete: false,
    order_status_counts: {},
    settlement: zeroSettlementBreakdown(),
    taxes_estimated: null,
    ...overrides,
  }
}

describe('pctOfNetRevenue', () => {
  it('returns percent of net revenue', () => {
    expect(pctOfNetRevenue(450, 900)).toBeCloseTo(50, 5)
  })

  it('returns null when net revenue is zero', () => {
    expect(pctOfNetRevenue(100, 0)).toBeNull()
  })
})

describe('buildTenantPnlRows', () => {
  it('inserts channel_margin between shipping and ads', () => {
    const rows = buildTenantPnlRows(baseKpi(), null, null)
    expect(rows.map((r) => r.id)).toEqual([
      'gross_revenue',
      'discounts',
      'returns',
      'net_revenue',
      'cogs',
      'gross_profit',
      'platform_fees',
      'merchant_shipping',
      'channel_margin',
      'ads_spend',
      'contribution_margin',
      'fixed_opex',
      'ebitda',
    ])
    const channel = rows.find((r) => r.id === 'channel_margin')
    expect(channel?.current).toBe(530)
    expect(channel?.marginPct).toBeCloseTo(58.89, 2)
    expect(channel?.rowHintKey).toBe('reportsPnlHintChannelMargin')
    expect(channel?.pctOfNetRevenue).toBeCloseTo((530 / 900) * 100, 5)
  })

  it('falls back to derived channel margin when API omits field', () => {
    const kpi = baseKpi({ channel_margin: undefined, channel_margin_pct: undefined })
    const rows = buildTenantPnlRows(kpi, null, null)
    const channel = rows.find((r) => r.id === 'channel_margin')
    // 600 - 50 - 20
    expect(channel?.current).toBe(530)
  })

  it('builds full waterfall rows with prior and yoy deltas', () => {
    const cur = baseKpi()
    const prev = baseKpi({
      net_revenue: 800,
      ebitda: 200,
      contribution_margin: 350,
      channel_margin: 480,
    })
    const yoy = baseKpi({
      net_revenue: 700,
      ebitda: 150,
    })
    const rows = buildTenantPnlRows(cur, prev, yoy)
    expect(rows).toHaveLength(13)
    expect(rows[0]?.id).toBe('gross_revenue')
    expect(rows.at(-1)?.id).toBe('ebitda')
    const ebitda = rows.find((r) => r.id === 'ebitda')
    expect(ebitda?.deltaAbs).toBe(100)
    expect(ebitda?.deltaPct).toBeCloseTo(50, 1)
    expect(ebitda?.yoyDeltaPct).toBeCloseTo(100, 1)
    expect(ebitda?.marginPct).toBe(33.33)
  })

  it('returns null deltas when prior/yoy missing', () => {
    const rows = buildTenantPnlRows(baseKpi(), null, null)
    expect(rows[0]?.previous).toBeNull()
    expect(rows[0]?.deltaPct).toBeNull()
    expect(rows[0]?.yoyDeltaPct).toBeNull()
  })
})

describe('buildProductPnlRows', () => {
  it('only includes merchandise lines and omits channel margin / tax path', () => {
    const kpi: ProductKpiResponse = {
      gross_revenue: 200,
      net_revenue: 180,
      cogs: 60,
      gross_profit: 120,
      gross_profit_on_gross: 140,
      gross_margin_pct: 66.67,
      units_sold: 4,
      order_count: 2,
      currency: 'MXN',
      settlement: zeroSettlementBreakdown(),
    }
    const rows = buildProductPnlRows(kpi, null, null)
    expect(rows.map((r) => r.id)).toEqual([
      'gross_revenue',
      'net_revenue',
      'cogs',
      'gross_profit',
    ])
  })
})
