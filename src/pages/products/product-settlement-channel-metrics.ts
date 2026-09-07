import type { ProductDetailApi, ProductSettlementApi } from '@/lib/types/catalog'
import type { ProductLinkGroupApi } from '@/lib/types/product-links'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type {
  ChannelPlatform,
  PlatformSettlementMetrics,
} from '@/pages/channels/channels-platform-aggregate'

import { productPlatformLabel } from './product-platform-label'

function emptySettlement(platform: string): PlatformSettlementMetrics {
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
    completeness: '',
  }
}

function addSettlement(
  target: PlatformSettlementMetrics,
  row: ProductSettlementApi & { completeness?: string },
): void {
  target.gross_revenue += row.gross_revenue
  target.discounts += row.discounts
  target.returns += row.returns
  target.net_revenue += row.net_revenue
  target.marketplace_fees += row.marketplace_fees
  target.shipping_charges += row.shipping_charges
  target.tax_withholdings += row.tax_withholdings
  target.estimated_payout += row.estimated_payout
  if (!target.completeness) target.completeness = row.completeness ?? ''
}

export function settlementPlatformsFromProduct(
  detail: ProductDetailApi,
  t: (key: ShellStringKey) => string,
): ChannelPlatform[] {
  const seen = new Set<string>()
  const out: ChannelPlatform[] = []
  for (const row of detail.period_settlement_by_platform ?? []) {
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

export function settlementPlatformsFromGroup(
  group: ProductLinkGroupApi,
  t: (key: ShellStringKey) => string,
): ChannelPlatform[] {
  const seen = new Set<string>()
  const out: ChannelPlatform[] = []
  for (const row of group.period_settlement_by_platform ?? []) {
    const slug = row.platform.trim().toLowerCase()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push({ slug, label: productPlatformLabel(row.platform, t) })
  }
  if (out.length > 0) return out
  for (const member of group.members) {
    const slug = member.platform.trim().toLowerCase()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push({ slug, label: productPlatformLabel(member.platform, t) })
  }
  return out
}

export function productSettlementByPlatformMetrics(
  detail: ProductDetailApi,
  platforms: ChannelPlatform[],
): Record<string, PlatformSettlementMetrics> {
  const byPlatform: Record<string, PlatformSettlementMetrics> = {}
  for (const platform of platforms) {
    byPlatform[platform.slug] = emptySettlement(platform.slug)
  }
  const total = emptySettlement('total')

  for (const row of detail.period_settlement_by_platform ?? []) {
    const slug = row.platform.trim().toLowerCase()
    const target = byPlatform[slug]
    if (!target) continue
    addSettlement(target, row)
    addSettlement(total, row)
  }

  if ((detail.period_settlement_by_platform ?? []).length === 0 && detail.period_settlement) {
    addSettlement(total, detail.period_settlement)
  }

  const result: Record<string, PlatformSettlementMetrics> = {
    total: { ...total, completeness: total.completeness || 'unavailable' },
  }
  for (const platform of platforms) {
    const metrics = byPlatform[platform.slug]
    result[platform.slug] = {
      ...metrics,
      completeness: metrics.completeness || 'unavailable',
    }
  }
  return result
}

export function groupSettlementByPlatformMetrics(
  group: ProductLinkGroupApi,
  platforms: ChannelPlatform[],
): Record<string, PlatformSettlementMetrics> {
  const byPlatform: Record<string, PlatformSettlementMetrics> = {}
  for (const platform of platforms) {
    byPlatform[platform.slug] = emptySettlement(platform.slug)
  }
  const total = emptySettlement('total')

  for (const row of group.period_settlement_by_platform ?? []) {
    const slug = row.platform.trim().toLowerCase()
    const target = byPlatform[slug]
    if (!target) continue
    addSettlement(target, row)
    addSettlement(total, row)
  }

  if ((group.period_settlement_by_platform ?? []).length === 0 && group.period_settlement) {
    addSettlement(total, group.period_settlement)
  }

  const result: Record<string, PlatformSettlementMetrics> = {
    total: { ...total, completeness: total.completeness || 'unavailable' },
  }
  for (const platform of platforms) {
    const metrics = byPlatform[platform.slug]
    result[platform.slug] = {
      ...metrics,
      completeness: metrics.completeness || 'unavailable',
    }
  }
  return result
}
