import { describe, expect, it } from 'vitest'

import {
  estimatePlatformTaxAmounts,
  estimateTaxByPlatform,
  estimateSettlementTaxByPlatform,
  resolveRetainedSat,
  settlementWithEstimatedTax,
} from './product-pnl-tax-estimates'
import type {
  PlatformMetrics,
  PlatformSettlementMetrics,
} from '@/pages/channels/channels-platform-aggregate'
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

function settlement(
  partial: Partial<PlatformSettlementMetrics>,
): PlatformSettlementMetrics {
  return {
    platform: 'shopify',
    gross_revenue: 0,
    discounts: 0,
    returns: 0,
    net_revenue: 0,
    marketplace_fees: 0,
    shipping_charges: 0,
    tax_withholdings: 0,
    estimated_payout: 0,
    completeness: '',
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
  it('zeros withholdings for Shopify and applies rates to marketplaces', () => {
    const byPlatform = estimateTaxByPlatform(
      {
        shopify: metrics({
          platform: 'shopify',
          gross_revenue: 100_000,
          contribution_margin: 40_000,
        }),
        amazon: metrics({
          platform: 'amazon',
          gross_revenue: 100_000,
          contribution_margin: 40_000,
        }),
        total: metrics({
          platform: 'total',
          gross_revenue: 200_000,
          contribution_margin: 80_000,
        }),
      },
      ['shopify', 'amazon'].map((slug) => ({ slug })),
      MX_TYPICAL_TAX_RATES,
    )
    expect(byPlatform.shopify.withholding_total).toBe(0)
    expect(byPlatform.amazon.withholding_total).toBe(10_500)
    expect(byPlatform.total.withholding_total).toBe(10_500)
  })

  it('uses marketplaceSlug when column slug is a product id', () => {
    const productId = '449e22f4-fd0d-4264-9f20-d10092692d99'
    const byPlatform = estimateTaxByPlatform(
      {
        [productId]: metrics({
          platform: productId,
          gross_revenue: 100_000,
          contribution_margin: 40_000,
        }),
      },
      [{ slug: productId, marketplaceSlug: 'mercadolibre' }],
      MX_TYPICAL_TAX_RATES,
    )
    expect(byPlatform[productId].withholding_total).toBe(10_500)
  })
})

describe('estimateSettlementTaxByPlatform', () => {
  it('uses net − fees − shipping as liquidity base', () => {
    const byPlatform = estimateSettlementTaxByPlatform(
      {
        mercadolibre: settlement({
          platform: 'mercadolibre',
          gross_revenue: 100_000,
          net_revenue: 90_000,
          marketplace_fees: 10_000,
          shipping_charges: 5_000,
          estimated_payout: 75_000,
        }),
      },
      [{ slug: 'mercadolibre' }],
      MX_TYPICAL_TAX_RATES,
    )
    expect(byPlatform.mercadolibre.withholding_total).toBe(10_500)
    expect(byPlatform.mercadolibre.expected_net_cash).toBe(64_500)
  })
})

describe('resolveRetainedSat / settlementWithEstimatedTax', () => {
  it('prefers ingested settlement tax', () => {
    expect(resolveRetainedSat(1_000, 5_000)).toBe(1_000)
    expect(resolveRetainedSat(0, 5_000)).toBe(5_000)
  })

  it('folds estimated tax into settlement when ingested tax is zero', () => {
    const next = settlementWithEstimatedTax(
      {
        tax_withholdings: 0,
        net_revenue: 100,
        marketplace_fees: 10,
        shipping_charges: 5,
        estimated_payout: 85,
      },
      20,
    )
    expect(next.tax_withholdings).toBe(20)
    expect(next.estimated_payout).toBe(65)
  })
})
