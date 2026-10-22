import { describe, expect, it } from 'vitest'

import { alignChannelPnl } from '@/pages/channels/channels-pnl-align'
import type { PlatformAdsRollup } from '@/pages/channels/channels-ads-by-platform'
import type {
  PlatformMetrics,
  PlatformSettlementMetrics,
} from '@/pages/channels/channels-platform-aggregate'
import { zeroPlatformCancelCosts } from '@/lib/settlement-utils'

function metric(partial: Partial<PlatformMetrics> & { platform: string }): PlatformMetrics {
  return {
    gross_revenue: 0,
    discounts: 0,
    returns: 0,
    net_revenue: 0,
    order_count: 0,
    aov: 0,
    cogs: 0,
    gross_profit: 0,
    platform_fees_total: 0,
    merchant_shipping_cost: 0,
    ads_spend: 0,
    contribution_margin: 0,
    contribution_margin_pct: 0,
    units_sold: 0,
    ...partial,
  }
}

function settlement(
  partial: Partial<PlatformSettlementMetrics> & { platform: string },
): PlatformSettlementMetrics {
  return {
    gross_revenue: 0,
    discounts: 0,
    returns: 0,
    net_revenue: 0,
    marketplace_fees: 0,
    shipping_charges: 0,
    tax_withholdings: 0,
    estimated_payout: 0,
    completeness: 'complete',
    platform_cancel_costs: zeroPlatformCancelCosts(),
    ...partial,
  }
}

function rollup(linkedSpend: number): PlatformAdsRollup {
  return {
    byNetwork: {
      google_ads: 0,
      meta_ads: 0,
      amazon_ads: linkedSpend,
      mercadolibre_ads: 0,
    },
    attributedSales: 0,
    linkedSpend,
  }
}

describe('alignChannelPnl', () => {
  it('moves settlement shipping onto the P&L and keeps ads on the matching channel', () => {
    const aligned = alignChannelPnl({
      metrics: {
        mercadolibre: metric({
          platform: 'mercadolibre',
          net_revenue: 1_000,
          gross_profit: 600,
          contribution_margin: 545,
        }),
        amazon: metric({
          platform: 'amazon',
          net_revenue: 500,
          gross_profit: 200,
          contribution_margin: 200,
        }),
        total: metric({
          platform: 'total',
          net_revenue: 1_500,
          gross_profit: 800,
          contribution_margin: 745,
        }),
      },
      settlement: {
        mercadolibre: settlement({ platform: 'mercadolibre', shipping_charges: 126 }),
        amazon: settlement({ platform: 'amazon', shipping_charges: 0 }),
        total: settlement({ platform: 'total', shipping_charges: 126 }),
      },
      adsByPlatform: {
        amazon: rollup(50),
        mercadolibre: rollup(0),
      },
      tenantAdsSpend: 50,
    })

    expect(aligned.metrics.mercadolibre.merchant_shipping_cost).toBe(126)
    expect(aligned.metrics.mercadolibre.contribution_margin).toBe(419)
    expect(aligned.metrics.amazon.ads_spend).toBe(50)
    expect(aligned.metrics.amazon.contribution_margin).toBe(150)
    expect(aligned.metrics.total.ads_spend).toBe(50)
    expect(aligned.metrics.total.contribution_margin).toBe(569)
    expect(aligned.unlinkedAds).toBe(0)
  })
})
