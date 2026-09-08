import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { orderKpiChannelMargin } from '@/lib/sales-metric-basis'
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
  | 'channel_margin'
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
  /** Hint under subtotal/total labels (shell key resolved in table). */
  rowHintKey: ShellStringKey | null
  /** amount / net_revenue × 100 for the period. */
  pctOfNetRevenue: number | null
}

/** Shared table row for Estado de resultados and Retenciones estimadas. */
export type ReportsStatementRow = {
  id: string
  kind: PnlRowKind
  isDeduction: boolean
  current: number
  previous: number | null
  deltaAbs: number | null
  deltaPct: number | null
  yoyDeltaPct: number | null
  marginPct: number | null
  rowHintKey: ShellStringKey | null
  pctOfNetRevenue: number | null
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

/** % of net revenue for the P&L % VN column. */
export function pctOfNetRevenue(amount: number, netRevenue: number): number | null {
  if (!Number.isFinite(amount) || !Number.isFinite(netRevenue) || netRevenue === 0) {
    return null
  }
  return (amount / netRevenue) * 100
}

function resolveChannelMargin(kpi: KpiResponse): { amount: number; pct: number | null } {
  const amount = kpi.channel_margin ?? orderKpiChannelMargin(kpi)
  const pct =
    kpi.channel_margin_pct ??
    (kpi.net_revenue !== 0 ? (amount / kpi.net_revenue) * 100 : null)
  return { amount, pct }
}

function row(
  id: PnlRowId,
  kind: PnlRowKind,
  isDeduction: boolean,
  current: number,
  previous: number | null,
  yoy: number | null,
  netRevenue: number,
  marginPct: number | null = null,
  rowHintKey: ShellStringKey | null = null,
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
    rowHintKey,
    pctOfNetRevenue: pctOfNetRevenue(current, netRevenue),
  }
}

export function buildTenantPnlRows(
  kpi: KpiResponse,
  kpiPrev: KpiResponse | null,
  kpiYoy: KpiResponse | null,
): PnlRow[] {
  const p = (fn: (k: KpiResponse) => number): number | null => (kpiPrev ? fn(kpiPrev) : null)
  const y = (fn: (k: KpiResponse) => number): number | null => (kpiYoy ? fn(kpiYoy) : null)
  const net = kpi.net_revenue
  const channel = resolveChannelMargin(kpi)
  const channelPrev = kpiPrev ? resolveChannelMargin(kpiPrev).amount : null
  const channelYoy = kpiYoy ? resolveChannelMargin(kpiYoy).amount : null

  return [
    row('gross_revenue', 'line', false, kpi.gross_revenue, p((k) => k.gross_revenue), y((k) => k.gross_revenue), net),
    row('discounts', 'line', true, kpi.discounts, p((k) => k.discounts), y((k) => k.discounts), net),
    row('returns', 'line', true, kpi.returns, p((k) => k.returns), y((k) => k.returns), net),
    row('net_revenue', 'subtotal', false, kpi.net_revenue, p((k) => k.net_revenue), y((k) => k.net_revenue), net),
    row('cogs', 'line', true, kpi.cogs, p((k) => k.cogs), y((k) => k.cogs), net),
    row(
      'gross_profit',
      'subtotal',
      false,
      kpi.gross_profit,
      p((k) => k.gross_profit),
      y((k) => k.gross_profit),
      net,
      kpi.gross_margin_pct,
      'reportsPnlHintGrossProfit',
    ),
    row(
      'platform_fees',
      'line',
      true,
      kpi.platform_fees_total,
      p((k) => k.platform_fees_total),
      y((k) => k.platform_fees_total),
      net,
    ),
    row(
      'merchant_shipping',
      'line',
      true,
      kpi.merchant_shipping_cost,
      p((k) => k.merchant_shipping_cost),
      y((k) => k.merchant_shipping_cost),
      net,
    ),
    row(
      'channel_margin',
      'subtotal',
      false,
      channel.amount,
      channelPrev,
      channelYoy,
      net,
      channel.pct,
      'reportsPnlHintChannelMargin',
    ),
    row('ads_spend', 'line', true, kpi.ads_spend, p((k) => k.ads_spend), y((k) => k.ads_spend), net),
    row(
      'contribution_margin',
      'subtotal',
      false,
      kpi.contribution_margin,
      p((k) => k.contribution_margin),
      y((k) => k.contribution_margin),
      net,
      kpi.contribution_margin_pct,
      'reportsPnlHintContributionMargin',
    ),
    row(
      'fixed_opex',
      'line',
      true,
      kpi.fixed_operating_expenses,
      p((k) => k.fixed_operating_expenses),
      y((k) => k.fixed_operating_expenses),
      net,
    ),
    row(
      'ebitda',
      'total',
      false,
      kpi.ebitda,
      p((k) => k.ebitda),
      y((k) => k.ebitda),
      net,
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
  const net = kpi.net_revenue

  return [
    row('gross_revenue', 'line', false, kpi.gross_revenue, p((k) => k.gross_revenue), y((k) => k.gross_revenue), net),
    row('net_revenue', 'subtotal', false, kpi.net_revenue, p((k) => k.net_revenue), y((k) => k.net_revenue), net),
    row('cogs', 'line', true, kpi.cogs, p((k) => k.cogs), y((k) => k.cogs), net),
    row(
      'gross_profit',
      'total',
      false,
      kpi.gross_profit,
      p((k) => k.gross_profit),
      y((k) => k.gross_profit),
      net,
      kpi.gross_margin_pct,
    ),
  ]
}
