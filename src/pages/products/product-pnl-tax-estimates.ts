import type { TaxSettingsRates } from '@/lib/types/tax-settings'
import type { PlatformMetrics } from '@/pages/channels/channels-platform-aggregate'

/** Matches API `compute_platform_tax_amounts` (v0-placeholder / gross_revenue base). */
export type PlatformTaxEstimate = {
  withholding_isr: number
  withholding_iva: number
  withholding_total: number
  expected_net_cash: number
  base_amount: number
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function estimatePlatformTaxAmounts(
  baseAmount: number,
  liquidityBase: number,
  rates: TaxSettingsRates,
): PlatformTaxEstimate {
  const withholding_isr = roundMoney((baseAmount * rates.withholding_isr_pct) / 100)
  const withholding_iva = roundMoney((baseAmount * rates.withholding_iva_pct) / 100)
  const withholding_total = roundMoney(withholding_isr + withholding_iva)
  const expected_net_cash = roundMoney(liquidityBase - withholding_total)
  return {
    withholding_isr,
    withholding_iva,
    withholding_total,
    expected_net_cash,
    base_amount: baseAmount,
  }
}

/** Build per-platform + total tax estimates from P&L metrics (product/group matrices). */
export function estimateTaxByPlatform(
  metrics: Record<string, PlatformMetrics>,
  platformSlugs: string[],
  rates: TaxSettingsRates,
): Record<string, PlatformTaxEstimate> {
  const out: Record<string, PlatformTaxEstimate> = {}
  for (const slug of [...platformSlugs, 'total']) {
    const m = metrics[slug]
    if (!m) {
      out[slug] = estimatePlatformTaxAmounts(0, 0, rates)
      continue
    }
    out[slug] = estimatePlatformTaxAmounts(m.gross_revenue, m.contribution_margin, rates)
  }
  return out
}
