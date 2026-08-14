import { describe, expect, it } from 'vitest'

import type { ChannelKpiRow } from '@/lib/types/reports'
import {
  aggregateChannelKpisByPlatform,
  aggregateChannelSettlementByPlatform,
  grossMarginPct,
} from '@/pages/channels/channels-platform-aggregate'

const platforms = [
  { slug: 'shopify', label: 'Shopify' },
  { slug: 'mercadolibre', label: 'Mercado Libre' },
]

function row(partial: Partial<ChannelKpiRow> & Pick<ChannelKpiRow, 'platform'>): ChannelKpiRow {
  return {
    connection_id: partial.connection_id ?? 'c1',
    platform: partial.platform,
    shop_domain: partial.shop_domain ?? null,
    gross_revenue: partial.gross_revenue ?? 0,
    discounts: partial.discounts ?? 0,
    returns: partial.returns ?? 0,
    net_revenue: partial.net_revenue ?? 0,
    cogs: partial.cogs ?? 0,
    gross_profit: partial.gross_profit ?? 0,
    platform_fees_total: partial.platform_fees_total ?? 0,
    merchant_shipping_cost: partial.merchant_shipping_cost ?? 0,
    contribution_margin: partial.contribution_margin ?? 0,
    contribution_margin_pct: partial.contribution_margin_pct ?? 0,
    units_sold: partial.units_sold ?? 0,
    order_count: partial.order_count ?? 0,
    marketplace_fees: partial.marketplace_fees ?? 0,
    shipping_charges: partial.shipping_charges ?? 0,
    tax_withholdings: partial.tax_withholdings ?? 0,
    estimated_payout: partial.estimated_payout ?? 0,
    settlement_completeness: partial.settlement_completeness ?? 'unavailable',
  }
}

describe('aggregateChannelKpisByPlatform', () => {
  it('sums multiple connections of the same platform and builds total', () => {
    const agg = aggregateChannelKpisByPlatform(
      [
        row({
        connection_id: 'a',
        platform: 'shopify',
        gross_revenue: 1000,
        discounts: 50,
        returns: 50,
        net_revenue: 900,
        order_count: 9,
        cogs: 300,
        gross_profit: 600,
        platform_fees_total: 80,
        contribution_margin: 520,
      }),
      row({
        connection_id: 'b',
        platform: 'shopify',
        gross_revenue: 500,
        net_revenue: 450,
        order_count: 3,
        cogs: 100,
        gross_profit: 350,
        platform_fees_total: 20,
        contribution_margin: 330,
      }),
      row({
        connection_id: 'c',
        platform: 'mercadolibre',
        gross_revenue: 400,
        net_revenue: 350,
        order_count: 2,
        contribution_margin: 200,
        }),
      ],
      platforms,
    )

    expect(agg.shopify.net_revenue).toBe(1350)
    expect(agg.shopify.order_count).toBe(12)
    expect(agg.shopify.aov).toBe(112.5)
    expect(agg.shopify.contribution_margin).toBe(850)
    expect(agg.amazon).toBeUndefined()
    expect(agg.mercadolibre.net_revenue).toBe(350)
    expect(agg.total.net_revenue).toBe(1700)
    expect(agg.total.order_count).toBe(14)
  })

  it('computes CM% and AOV as zero when no orders / no net', () => {
    const agg = aggregateChannelKpisByPlatform([], platforms)
    expect(agg.total.aov).toBe(0)
    expect(agg.total.contribution_margin_pct).toBe(0)
  })
})

describe('grossMarginPct', () => {
  it('uses gross revenue denominator', () => {
    const agg = aggregateChannelKpisByPlatform(
      [
        row({
          platform: 'shopify',
          gross_revenue: 1000,
          gross_profit: 600,
        }),
      ],
      platforms,
    )
    expect(grossMarginPct(agg.shopify)).toBe(60)
  })
})

describe('aggregateChannelSettlementByPlatform', () => {
  it('sums settlement fields and merges completeness', () => {
    const agg = aggregateChannelSettlementByPlatform(
      [
        row({
          platform: 'shopify',
          gross_revenue: 1000,
          net_revenue: 900,
          marketplace_fees: 50,
          shipping_charges: 10,
          tax_withholdings: 5,
          estimated_payout: 835,
          settlement_completeness: 'partial',
        }),
        row({
          connection_id: 'b',
          platform: 'mercadolibre',
          gross_revenue: 400,
          net_revenue: 350,
          marketplace_fees: 35,
          shipping_charges: 20,
          tax_withholdings: 16,
          estimated_payout: 279,
          settlement_completeness: 'full',
        }),
      ],
      platforms,
    )

    expect(agg.shopify.marketplace_fees).toBe(50)
    expect(agg.shopify.estimated_payout).toBe(835)
    expect(agg.mercadolibre.estimated_payout).toBe(279)
    expect(agg.total.estimated_payout).toBe(1114)
    expect(agg.total.marketplace_fees).toBe(85)
    expect(agg.shopify.completeness).toBe('partial')
    expect(agg.mercadolibre.completeness).toBe('full')
    expect(agg.total.completeness).toBe('partial')
  })

  it('keeps unavailable when a platform has no settlement rows', () => {
    const agg = aggregateChannelSettlementByPlatform(
      [
        row({
          platform: 'shopify',
          settlement_completeness: 'full',
        }),
      ],
      platforms,
    )
    expect(agg.shopify.completeness).toBe('full')
    expect(agg.mercadolibre.completeness).toBe('unavailable')
  })
})
