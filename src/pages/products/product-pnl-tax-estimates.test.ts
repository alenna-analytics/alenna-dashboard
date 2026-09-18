import { describe, expect, it } from 'vitest'

import { estimatePlatformTaxAmounts, estimateTaxByPlatform } from './product-pnl-tax-estimates'
import type { PlatformMetrics } from '@/pages/channels/channels-platform-aggregate'
import { MX_TYPICAL_TAX_RATES } from '@/lib/types/tax-settings'

function metrics(partial: Partial<PlatformMetrics>): PlatformMetrics {
  return {
    platform: 'shopify',
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

describe('estimatePlatformTaxAmounts', () => {
  it('matches API placeholder formula on gross revenue', () => {
    const result = estimatePlatformTaxAmounts(100_000, 40_000, MX_TYPICAL_TAX_RATES)
    expect(result.withholding_isr).toBe(2500)
    expect(result.withholding_iva).toBe(8000)
    expect(result.withholding_total).toBe(10_500)
    expect(result.expected_net_cash).toBe(29_500)
  })
})

describe('estimateTaxByPlatform', () => {
  it('estimates per platform and total', () => {
    const byPlatform = estimateTaxByPlatform(
      {
        shopify: metrics({
          platform: 'shopify',
          gross_revenue: 100_000,
          contribution_margin: 40_000,
        }),
        total: metrics({
          platform: 'total',
          gross_revenue: 100_000,
          contribution_margin: 40_000,
        }),
      },
      ['shopify'],
      MX_TYPICAL_TAX_RATES,
    )
    expect(byPlatform.shopify.withholding_total).toBe(10_500)
    expect(byPlatform.total.withholding_total).toBe(10_500)
  })
})
