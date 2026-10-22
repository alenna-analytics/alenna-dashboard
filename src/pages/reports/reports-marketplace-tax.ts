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
  const ivaDivisor =
    rates.transferred_iva_pct > 0 ? 1 + rates.transferred_iva_pct / 100 : 1
  for (const platform of platforms) {
    const slug = platform.marketplaceSlug ?? platform.slug
    if (!platformWithholdsMarketplaceTax(slug)) continue
    const net = metrics[platform.slug]?.net_revenue ?? 0
    const exIva = net > 0 ? net / ivaDivisor : 0
    marketplaceBase = roundMoney(marketplaceBase + exIva)
  }
  return {
    withholding_isr: total.withholding_isr,
    withholding_iva: total.withholding_iva,
    withholding_total: total.withholding_total,
    transferred_iva: 0,
    expected_net_cash: roundMoney(ebitda - total.withholding_total),
    base_amount: marketplaceBase,
    base_field: 'net_revenue_ex_iva',
    formula_version: 'v0-placeholder-marketplace',
    settings: {
      withholding_isr_pct: rates.withholding_isr_pct,
      withholding_iva_pct: rates.withholding_iva_pct,
      transferred_iva_pct: rates.transferred_iva_pct,
    },
  }
}
