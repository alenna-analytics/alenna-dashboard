import { describe, expect, it } from 'vitest'

import type { ProductLinkGroupApi } from '@/lib/types/product-links'

import { groupChannelPnlMetrics, groupNetBasisGrossProfit } from './group-channel-pnl-metrics'
import { filterGroupPeriod } from './group-insight-dimension'

function baseGroup(
  overrides: Partial<ProductLinkGroupApi> = {},
): ProductLinkGroupApi {
  return {
    id: 'g1',
    title: 'Grupo',
    members: [],
    period_gross_units_sold: 10,
    period_net_units_sold: 10,
    period_cogs: 0,
    period_gross_sales: 700,
    period_net_sales: 595,
    // API field is gross sales − COGS (intentionally wrong for waterfall if used raw).
    period_gross_profit: 700,
    period_orders: 2,
    gross_margin_pct: 100,
    contribution_margin: 595,
    contribution_margin_pct: 100,
    channel_margin: 595,
    channel_margin_pct: 100,
    cm_incomplete: false,
    velocity_units_per_day_90d: null,
    consolidated_stock_quantity: null,
    inventory_days: null,
    period_by_platform: [
      {
        platform: 'shopify',
        gross_sales: 700,
        net_sales: 595,
        gross_units_sold: 10,
        net_units_sold: 10,
        sales: 700,
        units_sold: 10,
      },
    ],
    period_settlement: {
      gross_revenue: 700,
      discounts: 105,
      returns: 0,
      net_revenue: 595,
      marketplace_fees: 0,
      shipping_charges: 0,
      tax_withholdings: 0,
      estimated_payout: 595,
      completeness: 'complete',
    },
    period_settlement_by_platform: [],
    period_start: null,
    period_end: null,
    base_currency: 'MXN',
    ...overrides,
  }
}

describe('groupNetBasisGrossProfit', () => {
  it('uses net sales − COGS, not API period_gross_profit', () => {
    const group = baseGroup()
    expect(group.period_gross_profit).toBe(700)
    expect(groupNetBasisGrossProfit(group)).toBe(595)
  })
})

describe('filterGroupPeriod', () => {
  it('exposes net-basis utilidad bruta for the group waterfall', () => {
    const period = filterGroupPeriod(baseGroup(), [], true)
    expect(period.period_gross_profit).toBe(595)
    expect(period.period_net_sales).toBe(595)
    expect(period.period_gross_profit).toBeLessThanOrEqual(period.period_net_sales)
  })
})

describe('groupChannelPnlMetrics', () => {
  it('keeps channel gross_profit on net sales basis', () => {
    const group = baseGroup()
    const metrics = groupChannelPnlMetrics(group, [{ slug: 'shopify', label: 'Shopify' }])
    expect(metrics.shopify.gross_profit).toBe(595)
    expect(metrics.total.gross_profit).toBe(595)
  })
})
