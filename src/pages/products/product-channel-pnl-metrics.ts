import type { ProductDetailApi } from '@/lib/types/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type {
  ChannelPlatform,
  PlatformMetrics,
} from '@/pages/channels/channels-platform-aggregate'

import { productPlatformLabel } from './product-platform-label'

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

export function productChannelPlatforms(
  detail: ProductDetailApi,
  t: (key: ShellStringKey) => string,
): ChannelPlatform[] {
  const seen = new Set<string>()
  const out: ChannelPlatform[] = []
  for (const row of detail.period_by_platform ?? []) {
    const slug = row.platform.trim().toLowerCase()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push({ slug, label: productPlatformLabel(row.platform, t) })
  }
  if (out.length > 0) return out
  for (const listing of detail.listings) {
    const slug = listing.platform.trim().toLowerCase()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push({ slug, label: productPlatformLabel(listing.platform, t) })
  }
  return out
}

/** Build Channels-module PlatformMetrics from product period aggregates. */
export function productChannelPnlMetrics(
  detail: ProductDetailApi,
  platforms: ChannelPlatform[],
): Record<string, PlatformMetrics> {
  const settlements = new Map(
    (detail.period_settlement_by_platform ?? []).map(
      (row) => [row.platform.trim().toLowerCase(), row] as const,
    ),
  )
  const byPlatform: Record<string, PlatformMetrics> = {}
  for (const platform of platforms) {
    byPlatform[platform.slug] = emptyMetrics(platform.slug)
  }
  const total = emptyMetrics('total')

  for (const row of detail.period_by_platform ?? []) {
    const slug = row.platform.trim().toLowerCase()
    const target = byPlatform[slug]
    if (!target) continue
    const settlement = settlements.get(slug)
    const share =
      detail.period_net_sales > 0 ? row.net_sales / detail.period_net_sales : 0
    const grossProfit = detail.gross_profit * share
    const cogs = detail.period_cogs * share
    const contribution = detail.contribution_margin * share
    const discounts =
      settlement?.discounts ?? detail.period_settlement.discounts * share
    const returns = settlement?.returns ?? detail.period_settlement.returns * share
    const grossRevenue =
      settlement?.gross_revenue ?? detail.period_settlement.gross_revenue * share
    const fees = settlement?.marketplace_fees ?? 0
    const shipping = settlement?.shipping_charges ?? 0
    const units = row.net_units_sold || row.gross_units_sold || row.units_sold || 0
    const ordersShare = share * detail.period_orders

    target.gross_revenue += grossRevenue
    target.discounts += discounts
    target.returns += returns
    target.net_revenue += row.net_sales
    target.order_count += ordersShare
    target.cogs += cogs
    target.gross_profit += grossProfit
    target.platform_fees_total += fees
    target.merchant_shipping_cost += shipping
    target.contribution_margin += contribution
    target.units_sold += units

    total.gross_revenue += grossRevenue
    total.discounts += discounts
    total.returns += returns
    total.net_revenue += row.net_sales
    total.order_count += ordersShare
    total.cogs += cogs
    total.gross_profit += grossProfit
    total.platform_fees_total += fees
    total.merchant_shipping_cost += shipping
    total.contribution_margin += contribution
    total.units_sold += units
  }

  const result: Record<string, PlatformMetrics> = {
    total: finishMetrics(total),
  }
  for (const platform of platforms) {
    result[platform.slug] = finishMetrics(byPlatform[platform.slug])
  }
  return result
}
