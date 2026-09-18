import { describe, expect, it } from 'vitest'

import type { PlatformMetrics } from '@/pages/channels/channels-platform-aggregate'
import { buildMarketplaceAwareTaxesEstimated } from '@/pages/reports/reports-marketplace-tax'
import { MX_TYPICAL_TAX_RATES } from '@/lib/types/tax-settings'

function metrics(partial: Partial<PlatformMetrics> & { platform: string }): PlatformMetrics {
  return {
    platform: partial.platform,
    gross_revenue: partial.gross_revenue ?? 0,
    discounts: 0,
    returns: 0,
    net_revenue: partial.net_revenue ?? partial.gross_revenue ?? 0,
    order_count: 0,
    aov: 0,
    cogs: 0,
    gross_profit: 0,
    platform_fees_total: 0,
    merchant_shipping_cost: 0,
    ads_spend: 0,
    contribution_margin: partial.contribution_margin ?? 0,
    contribution_margin_pct: 0,
    units_sold: 0,
  }
}

describe('buildMarketplaceAwareTaxesEstimated', () => {
  it('excludes Shopify gross from withholdings and uses ebitda for expected net cash', () => {
    const platforms = [
      { slug: 'shopify', label: 'Shopify' },
      { slug: 'amazon', label: 'Amazon' },
    ]
    const byPlatform = {
      shopify: metrics({ platform: 'shopify', gross_revenue: 100_000, contribution_margin: 50_000 }),
      amazon: metrics({ platform: 'amazon', gross_revenue: 100_000, contribution_margin: 40_000 }),
      total: metrics({ platform: 'total', gross_revenue: 200_000, contribution_margin: 90_000 }),
    }
    const ebitda = 80_000
    const result = buildMarketplaceAwareTaxesEstimated(
      byPlatform,
      platforms,
      MX_TYPICAL_TAX_RATES,
      ebitda,
    )

    // Only Amazon: 2.5% ISR + 8% IVA on 100_000
    expect(result.withholding_isr).toBe(2500)
    expect(result.withholding_iva).toBe(8000)
    expect(result.withholding_total).toBe(10_500)
    expect(result.expected_net_cash).toBe(69_500)
    expect(result.base_amount).toBe(100_000)
  })
})
