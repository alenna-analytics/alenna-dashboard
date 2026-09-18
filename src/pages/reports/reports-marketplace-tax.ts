import type { TaxesEstimated } from '@/lib/types/reports'
import type { TaxSettingsRates } from '@/lib/types/tax-settings'
import type {
  ChannelPlatform,
  PlatformMetrics,
} from '@/pages/channels/channels-platform-aggregate'
import { platformWithholdsMarketplaceTax } from '@/pages/products/platform-withholds-tax'
import {
  estimateTaxByPlatform,
  type PlatformTaxEstimate,
} from '@/pages/products/product-pnl-tax-estimates'

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Marketplace-aware consolidated tax block for Reports (VISTA 1).
 * Excludes Shopify from withholdings (same rule as Channels / products).
 * Expected net cash = ebitda − marketplace withholding total (not CM).
 */
export function buildMarketplaceAwareTaxesEstimated(
  metrics: Record<string, PlatformMetrics>,
  platforms: ChannelPlatform[],
  rates: TaxSettingsRates,
  ebitda: number,
): TaxesEstimated {
  const byPlatform = estimateTaxByPlatform(metrics, platforms, rates)
  const total: PlatformTaxEstimate = byPlatform.total
  let marketplaceBase = 0
  for (const platform of platforms) {
    const slug = platform.marketplaceSlug ?? platform.slug
    if (!platformWithholdsMarketplaceTax(slug)) continue
    marketplaceBase = roundMoney(
      marketplaceBase + (metrics[platform.slug]?.gross_revenue ?? 0),
    )
  }
  return {
    withholding_isr: total.withholding_isr,
    withholding_iva: total.withholding_iva,
    withholding_total: total.withholding_total,
    transferred_iva: 0,
    expected_net_cash: roundMoney(ebitda - total.withholding_total),
    base_amount: marketplaceBase,
    base_field: 'gross_revenue',
    formula_version: 'v0-placeholder-marketplace',
    settings: {
      withholding_isr_pct: rates.withholding_isr_pct,
      withholding_iva_pct: rates.withholding_iva_pct,
      transferred_iva_pct: rates.transferred_iva_pct,
    },
  }
}
