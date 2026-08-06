import type { ChannelKpiRow } from '@/lib/types/reports'
import { pctVersusPrevious } from '@/pages/reports/reports-ui-helpers'

export type ChannelPlatform = {
  slug: string
  label: string
}

export type PlatformMetrics = {
  platform: string
  gross_revenue: number
  discounts: number
  returns: number
  net_revenue: number
  order_count: number
  aov: number
  cogs: number
  gross_profit: number
  platform_fees_total: number
  merchant_shipping_cost: number
  ads_spend: number
  contribution_margin: number
  contribution_margin_pct: number
  units_sold: number
}

export type PlatformSettlementMetrics = {
  platform: string
  gross_revenue: number
  discounts: number
  returns: number
  net_revenue: number
  marketplace_fees: number
  shipping_charges: number
  tax_withholdings: number
  estimated_payout: number
  completeness: string
}

function emptySettlementMetrics(platform: string): PlatformSettlementMetrics {
  return {
    platform,
    gross_revenue: 0,
    discounts: 0,
    returns: 0,
    net_revenue: 0,
    marketplace_fees: 0,
    shipping_charges: 0,
    tax_withholdings: 0,
    estimated_payout: 0,
    completeness: 'unavailable',
  }
}

function mergeCompleteness(a: string, b: string): string {
  const rank = (c: string) => {
    const x = c.trim().toLowerCase()
    if (x === 'unavailable') return 0
    if (x === 'partial') return 1
    return 2
  }
  return rank(a) <= rank(b) ? a : b
}

function addSettlementRow(target: PlatformSettlementMetrics, row: ChannelKpiRow): void {
  target.gross_revenue += row.gross_revenue
  target.discounts += row.discounts
  target.returns += row.returns
  target.net_revenue += row.net_revenue
  target.marketplace_fees += row.marketplace_fees
  target.shipping_charges += row.shipping_charges
  target.tax_withholdings += row.tax_withholdings
  target.estimated_payout += row.estimated_payout
  target.completeness = mergeCompleteness(target.completeness, row.settlement_completeness)
}

export function aggregateChannelSettlementByPlatform(
  items: ChannelKpiRow[],
  platforms: ChannelPlatform[],
): Record<string, PlatformSettlementMetrics> {
  const byPlatform: Record<string, PlatformSettlementMetrics> = {}
  for (const platform of platforms) {
    byPlatform[platform.slug] = emptySettlementMetrics(platform.slug)
  }
  const total = emptySettlementMetrics('total')

  for (const row of items) {
    const slug = row.platform.trim().toLowerCase()
    if (byPlatform[slug]) {
      addSettlementRow(byPlatform[slug], row)
    }
    addSettlementRow(total, row)
  }

  const result: Record<string, PlatformSettlementMetrics> = {
    total,
  }
  for (const platform of platforms) {
    result[platform.slug] = byPlatform[platform.slug]
  }
  return result
}

function emptyMetrics(platform: string): PlatformMetrics {
  return {
    platform,
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
  }
}

function finishMetrics(m: PlatformMetrics): PlatformMetrics {
  const aov = m.order_count > 0 ? m.net_revenue / m.order_count : 0
  const contribution_margin_pct =
    m.net_revenue !== 0 ? (m.contribution_margin / m.net_revenue) * 100 : 0
  return { ...m, aov, contribution_margin_pct }
}

function addRow(target: PlatformMetrics, row: ChannelKpiRow): void {
  target.gross_revenue += row.gross_revenue
  target.discounts += row.discounts
  target.returns += row.returns
  target.net_revenue += row.net_revenue
  target.order_count += row.order_count
  target.cogs += row.cogs
  target.gross_profit += row.gross_profit
  target.platform_fees_total += row.platform_fees_total
  target.merchant_shipping_cost += row.merchant_shipping_cost
  target.contribution_margin += row.contribution_margin
  target.units_sold += row.units_sold
}

export function aggregateChannelKpisByPlatform(
  items: ChannelKpiRow[],
  platforms: ChannelPlatform[],
): Record<string, PlatformMetrics> {
  const byPlatform: Record<string, PlatformMetrics> = {}
  for (const platform of platforms) {
    byPlatform[platform.slug] = emptyMetrics(platform.slug)
  }
  const total = emptyMetrics('total')

  for (const row of items) {
    const slug = row.platform.trim().toLowerCase()
    if (byPlatform[slug]) {
      addRow(byPlatform[slug], row)
    }
    addRow(total, row)
  }

  const result: Record<string, PlatformMetrics> = {
    total: finishMetrics(total),
  }
  for (const platform of platforms) {
    result[platform.slug] = finishMetrics(byPlatform[platform.slug])
  }
  return result
}

export type ScoreboardMetricId =
  | 'gross_revenue'
  | 'discounts'
  | 'returns'
  | 'net_revenue'
  | 'order_count'
  | 'aov'
  | 'contribution_margin'
  | 'contribution_margin_pct'

export type ScoreboardCell = {
  value: number
  deltaPct: number | null
}

export type ScoreboardRow = {
  id: ScoreboardMetricId
  cells: Record<string, ScoreboardCell>
}

function metricValue(m: PlatformMetrics, id: ScoreboardMetricId): number {
  return m[id]
}

export function buildScoreboardRows(
  current: Record<string, PlatformMetrics>,
  previous: Record<string, PlatformMetrics> | null,
  platforms: ChannelPlatform[],
): ScoreboardRow[] {
  const ids: ScoreboardMetricId[] = [
    'gross_revenue',
    'discounts',
    'returns',
    'net_revenue',
    'order_count',
    'aov',
    'contribution_margin',
    'contribution_margin_pct',
  ]
  const cols = [...platforms.map((platform) => platform.slug), 'total']

  return ids.map((id) => {
    const cells: Record<string, ScoreboardCell> = {}
    for (const col of cols) {
      const value = metricValue(current[col], id)
      const prevVal = previous ? metricValue(previous[col], id) : null
      cells[col] = {
        value,
        deltaPct:
          prevVal === null ? null : (pctVersusPrevious(value, prevVal)?.pct ?? null),
      }
    }
    return { id, cells }
  })
}

export function grossMarginPct(m: PlatformMetrics): number {
  if (m.gross_revenue === 0) return 0
  return (m.gross_profit / m.gross_revenue) * 100
}
