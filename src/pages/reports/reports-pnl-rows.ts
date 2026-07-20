import type { KpiResponse, ProductKpiResponse } from '@/lib/types/reports'

import { pctVersusPrevious } from '@/pages/reports/reports-ui-helpers'

export type PnlRowKind = 'line' | 'subtotal' | 'total'

export type PnlRowId =
  | 'gross_revenue'
  | 'discounts'
  | 'returns'
  | 'net_revenue'
  | 'cogs'
  | 'gross_profit'
  | 'platform_fees'
  | 'merchant_shipping'
  | 'ads_spend'
  | 'contribution_margin'
  | 'fixed_opex'
  | 'ebitda'

export type PnlRow = {
  id: PnlRowId
  kind: PnlRowKind
  isDeduction: boolean
  current: number
  previous: number | null
  yoy: number | null
  deltaAbs: number | null
  deltaPct: number | null
  yoyDeltaPct: number | null
  /** Optional margin % shown next to subtotal/total labels */
  marginPct: number | null
}

function moneyDelta(
  current: number,
  previous: number | null,
): { deltaAbs: number | null; deltaPct: number | null } {
  if (previous === null) return { deltaAbs: null, deltaPct: null }
  const trend = pctVersusPrevious(current, previous)
  return {
    deltaAbs: current - previous,
    deltaPct: trend?.pct ?? null,
  }
}

function row(
  id: PnlRowId,
  kind: PnlRowKind,
  isDeduction: boolean,
  current: number,
  previous: number | null,
  yoy: number | null,
  marginPct: number | null = null,
): PnlRow {
  const { deltaAbs, deltaPct } = moneyDelta(current, previous)
  const yoyTrend = yoy === null ? null : pctVersusPrevious(current, yoy)
  return {
    id,
    kind,
    isDeduction,
    current,
    previous,
    yoy,
    deltaAbs,
    deltaPct,
    yoyDeltaPct: yoyTrend?.pct ?? null,
    marginPct,
  }
}

export function buildTenantPnlRows(
  kpi: KpiResponse,
  kpiPrev: KpiResponse | null,
  kpiYoy: KpiResponse | null,
): PnlRow[] {
  const p = (fn: (k: KpiResponse) => number): number | null => (kpiPrev ? fn(kpiPrev) : null)
  const y = (fn: (k: KpiResponse) => number): number | null => (kpiYoy ? fn(kpiYoy) : null)

  return [
    row('gross_revenue', 'line', false, kpi.gross_revenue, p((k) => k.gross_revenue), y((k) => k.gross_revenue)),
    row('discounts', 'line', true, kpi.discounts, p((k) => k.discounts), y((k) => k.discounts)),
    row('returns', 'line', true, kpi.returns, p((k) => k.returns), y((k) => k.returns)),
    row('net_revenue', 'subtotal', false, kpi.net_revenue, p((k) => k.net_revenue), y((k) => k.net_revenue)),
    row('cogs', 'line', true, kpi.cogs, p((k) => k.cogs), y((k) => k.cogs)),
    row(
      'gross_profit',
      'subtotal',
      false,
      kpi.gross_profit,
      p((k) => k.gross_profit),
      y((k) => k.gross_profit),
      kpi.gross_margin_pct,
    ),
    row(
      'platform_fees',
      'line',
      true,
      kpi.platform_fees_total,
      p((k) => k.platform_fees_total),
      y((k) => k.platform_fees_total),
    ),
    row(
      'merchant_shipping',
      'line',
      true,
      kpi.merchant_shipping_cost,
      p((k) => k.merchant_shipping_cost),
      y((k) => k.merchant_shipping_cost),
    ),
    row('ads_spend', 'line', true, kpi.ads_spend, p((k) => k.ads_spend), y((k) => k.ads_spend)),
    row(
      'contribution_margin',
      'subtotal',
      false,
      kpi.contribution_margin,
      p((k) => k.contribution_margin),
      y((k) => k.contribution_margin),
      kpi.contribution_margin_pct,
    ),
    row(
      'fixed_opex',
      'line',
      true,
      kpi.fixed_operating_expenses,
      p((k) => k.fixed_operating_expenses),
      y((k) => k.fixed_operating_expenses),
    ),
    row(
      'ebitda',
      'total',
      false,
      kpi.ebitda,
      p((k) => k.ebitda),
      y((k) => k.ebitda),
      kpi.ebitda_margin_pct,
    ),
  ]
}

export function buildProductPnlRows(
  kpi: ProductKpiResponse,
  kpiPrev: ProductKpiResponse | null,
  kpiYoy: ProductKpiResponse | null,
): PnlRow[] {
  const p = (fn: (k: ProductKpiResponse) => number): number | null => (kpiPrev ? fn(kpiPrev) : null)
  const y = (fn: (k: ProductKpiResponse) => number): number | null => (kpiYoy ? fn(kpiYoy) : null)

  return [
    row('gross_revenue', 'line', false, kpi.gross_revenue, p((k) => k.gross_revenue), y((k) => k.gross_revenue)),
    row('net_revenue', 'subtotal', false, kpi.net_revenue, p((k) => k.net_revenue), y((k) => k.net_revenue)),
    row('cogs', 'line', true, kpi.cogs, p((k) => k.cogs), y((k) => k.cogs)),
    row(
      'gross_profit',
      'total',
      false,
      kpi.gross_profit,
      p((k) => k.gross_profit),
      y((k) => k.gross_profit),
      kpi.gross_margin_pct,
    ),
  ]
}
