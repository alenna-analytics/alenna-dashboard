import type { TaxSettingsRates } from '@/lib/types/tax-settings'
import type {
  PlatformMetrics,
  PlatformSettlementMetrics,
} from '@/pages/channels/channels-platform-aggregate'

import { platformWithholdsMarketplaceTax } from './platform-withholds-tax'

/** Matches API `compute_platform_tax_amounts` (v0-placeholder / gross_revenue base). */
export type PlatformTaxEstimate = {
  withholding_isr: number
  withholding_iva: number
  withholding_total: number
  expected_net_cash: number
  base_amount: number
  /** Applied ISR % for this platform (0 when platform does not withhold). */
  isr_pct: number
  /** Applied IVA % for this platform (0 when platform does not withhold). */
  iva_pct: number
}

const ZERO_RATES: TaxSettingsRates = {
  withholding_isr_pct: 0,
  withholding_iva_pct: 0,
  transferred_iva_pct: 0,
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function ratesForPlatform(
  platform: string,
  rates: TaxSettingsRates,
): TaxSettingsRates {
  return platformWithholdsMarketplaceTax(platform) ? rates : ZERO_RATES
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
    isr_pct: rates.withholding_isr_pct,
    iva_pct: rates.withholding_iva_pct,
  }
}

function sumEstimates(
  rows: PlatformTaxEstimate[],
): PlatformTaxEstimate {
  const empty: PlatformTaxEstimate = {
    withholding_isr: 0,
    withholding_iva: 0,
    withholding_total: 0,
    expected_net_cash: 0,
    base_amount: 0,
    isr_pct: 0,
    iva_pct: 0,
  }
  return rows.reduce(
    (acc, row) => ({
      withholding_isr: roundMoney(acc.withholding_isr + row.withholding_isr),
      withholding_iva: roundMoney(acc.withholding_iva + row.withholding_iva),
      withholding_total: roundMoney(acc.withholding_total + row.withholding_total),
      expected_net_cash: roundMoney(acc.expected_net_cash + row.expected_net_cash),
      base_amount: roundMoney(acc.base_amount + row.base_amount),
      isr_pct: 0,
      iva_pct: 0,
    }),
    empty,
  )
}

/** Build per-platform + total tax estimates from P&L metrics (product/group matrices). */
export function estimateTaxByPlatform(
  metrics: Record<string, PlatformMetrics>,
  platforms: Array<{ slug: string; marketplaceSlug?: string }>,
  rates: TaxSettingsRates,
): Record<string, PlatformTaxEstimate> {
  const out: Record<string, PlatformTaxEstimate> = {}
  const perPlatform: PlatformTaxEstimate[] = []
  for (const platform of platforms) {
    const slug = platform.slug
    const m = metrics[slug]
    const effective = ratesForPlatform(platform.marketplaceSlug ?? slug, rates)
    const estimate = m
      ? estimatePlatformTaxAmounts(m.gross_revenue, m.contribution_margin, effective)
      : estimatePlatformTaxAmounts(0, 0, effective)
    out[slug] = estimate
    perPlatform.push(estimate)
  }
  out.total = sumEstimates(perPlatform)
  return out
}

/**
 * Cobro-view tax estimates: withholdings from gross; expected net cash =
 * net_revenue − fees − shipping − withholdings.
 */
export function estimateSettlementTaxByPlatform(
  metrics: Record<string, PlatformSettlementMetrics>,
  platforms: Array<{ slug: string; marketplaceSlug?: string }>,
  rates: TaxSettingsRates,
): Record<string, PlatformTaxEstimate> {
  const out: Record<string, PlatformTaxEstimate> = {}
  const perPlatform: PlatformTaxEstimate[] = []
  for (const platform of platforms) {
    const slug = platform.slug
    const m = metrics[slug]
    const effective = ratesForPlatform(platform.marketplaceSlug ?? slug, rates)
    if (!m) {
      const empty = estimatePlatformTaxAmounts(0, 0, effective)
      out[slug] = empty
      perPlatform.push(empty)
      continue
    }
    const liquidityBase =
      m.net_revenue - m.marketplace_fees - m.shipping_charges
    const estimate = estimatePlatformTaxAmounts(m.gross_revenue, liquidityBase, effective)
    out[slug] = estimate
    perPlatform.push(estimate)
  }
  out.total = sumEstimates(perPlatform)
  return out
}

/** Prefer ingested settlement tax; otherwise use rate-based estimate. */
export function resolveRetainedSat(
  settlementTaxWithholdings: number,
  estimatedTotal: number,
): number {
  if (settlementTaxWithholdings > 0) return settlementTaxWithholdings
  return Math.max(0, estimatedTotal)
}

/**
 * When settlement omitted tax, fold estimated withholdings into display settlement
 * so waterfall / cobro neto stay consistent with Retenido SAT.
 */
export function settlementWithEstimatedTax<
  T extends {
    tax_withholdings: number
    net_revenue: number
    marketplace_fees: number
    shipping_charges: number
    estimated_payout: number
  },
>(settlement: T, estimatedWithholding: number): T {
  if (settlement.tax_withholdings > 0 || estimatedWithholding <= 0) return settlement
  const tax = estimatedWithholding
  const estimated_payout = roundMoney(
    settlement.net_revenue -
      settlement.marketplace_fees -
      settlement.shipping_charges -
      tax,
  )
  return { ...settlement, tax_withholdings: tax, estimated_payout }
}
