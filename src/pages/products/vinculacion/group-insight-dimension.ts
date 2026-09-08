import { useMemo, useState } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type {
  ProductLinkGroupApi,
  ProductLinkGroupMemberApi,
  ProductLinkGroupSettlementApi,
} from '@/lib/types/product-links'
import type {
  ChannelPlatform,
  PlatformMetrics,
  PlatformSettlementMetrics,
} from '@/pages/channels/channels-platform-aggregate'
import type { FilterOption } from '@/ui/filters/types'

import {
  connectionIdsForPlatform,
  PRODUCT_DETAIL_ALL_CHANNELS,
} from '../product-detail-analytics-filter'
import { productPlatformLabel } from '../product-platform-label'
import { groupChannelPnlMetrics, groupChannelPlatforms } from './group-channel-pnl-metrics'

export type GroupInsightDimension = 'channel' | 'product'

export const GROUP_INSIGHT_ALL_PRODUCTS = '__all_products__'

type ShellT = (key: ShellStringKey) => string

export type FilteredGroupPeriod = {
  period_gross_sales: number
  period_net_sales: number
  period_gross_profit: number
  gross_margin_pct: number
  contribution_margin: number
  contribution_margin_pct: number
  channel_margin: number
  channel_margin_pct: number
  units: number
  period_cogs: number
  period_orders: number
  fees: number
  shipping: number
}

export function memberPlatformSlug(member: ProductLinkGroupMemberApi): string {
  return member.platform.trim().toLowerCase()
}

export function filterGroupPeriod(
  group: ProductLinkGroupApi,
  members: ProductLinkGroupMemberApi[],
  allSelected: boolean,
): FilteredGroupPeriod {
  if (allSelected) {
    const units = group.period_net_units_sold || group.period_gross_units_sold
    return {
      period_gross_sales: group.period_gross_sales,
      period_net_sales: group.period_net_sales,
      period_gross_profit: group.period_gross_profit,
      gross_margin_pct: group.gross_margin_pct,
      contribution_margin: group.contribution_margin,
      contribution_margin_pct: group.contribution_margin_pct,
      channel_margin: group.channel_margin,
      channel_margin_pct: group.channel_margin_pct,
      units,
      period_cogs: group.period_cogs,
      period_orders: group.period_orders,
      fees: group.period_settlement.marketplace_fees,
      shipping: group.period_settlement.shipping_charges,
    }
  }

  const netSales = members.reduce((sum, member) => sum + (member.period_net_sales ?? 0), 0)
  const grossSales = members.reduce((sum, member) => sum + (member.period_gross_sales ?? 0), 0)
  const share = group.period_net_sales > 0 ? netSales / group.period_net_sales : 0
  const grossProfit = group.period_gross_profit * share
  const cogs = group.period_cogs * share
  const contribution = group.contribution_margin * share
  const units = members.reduce(
    (sum, member) => sum + (member.period_net_units_sold || member.period_gross_units_sold || 0),
    0,
  )
  const orders = members.reduce((sum, member) => sum + (member.period_orders ?? 0), 0)
  const platforms = new Set(members.map(memberPlatformSlug))
  const fees = (group.period_settlement_by_platform ?? [])
    .filter((row) => platforms.has(row.platform.trim().toLowerCase()))
    .reduce((sum, row) => sum + row.marketplace_fees, 0)
  const shipping = (group.period_settlement_by_platform ?? [])
    .filter((row) => platforms.has(row.platform.trim().toLowerCase()))
    .reduce((sum, row) => sum + row.shipping_charges, 0)
  // When filtering by product within a shared channel, allocate fees by sales share.
  const allocatedFees =
    members.length === 1 && platforms.size === 1 ? fees * share : fees
  const allocatedShipping =
    members.length === 1 && platforms.size === 1 ? shipping * share : shipping
  const channelMargin = grossProfit - allocatedFees - allocatedShipping
  return {
    period_gross_sales: grossSales,
    period_net_sales: netSales,
    period_gross_profit: grossProfit,
    gross_margin_pct: netSales > 0 ? (grossProfit / netSales) * 100 : 0,
    contribution_margin: contribution,
    contribution_margin_pct: netSales > 0 ? (contribution / netSales) * 100 : 0,
    channel_margin: channelMargin,
    channel_margin_pct: netSales > 0 ? (channelMargin / netSales) * 100 : 0,
    units,
    period_cogs: cogs,
    period_orders: orders,
    fees: allocatedFees,
    shipping: allocatedShipping,
  }
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

/** Build ChannelsPnlTable columns from group members (product dimension). */
export function groupProductPlatforms(group: ProductLinkGroupApi): ChannelPlatform[] {
  return group.members.map((member) => ({
    slug: member.product_id,
    label: member.variant_label?.trim() || member.title,
  }))
}

export function groupProductPnlMetrics(
  group: ProductLinkGroupApi,
  platforms: ChannelPlatform[],
): Record<string, PlatformMetrics> {
  const byProduct: Record<string, PlatformMetrics> = {}
  for (const platform of platforms) {
    byProduct[platform.slug] = emptyMetrics(platform.slug)
  }
  const total = emptyMetrics('total')
  const settlements = new Map(
    (group.period_settlement_by_platform ?? []).map(
      (row) => [row.platform.trim().toLowerCase(), row] as const,
    ),
  )

  for (const member of group.members) {
    const target = byProduct[member.product_id]
    if (!target) continue
    const netSales = member.period_net_sales ?? 0
    const grossSales = member.period_gross_sales ?? 0
    const share = group.period_net_sales > 0 ? netSales / group.period_net_sales : 0
    const platformSlug = memberPlatformSlug(member)
    const settlement = settlements.get(platformSlug)
    const platformMembers = group.members.filter(
      (item) => memberPlatformSlug(item) === platformSlug,
    )
    const platformNet = platformMembers.reduce(
      (sum, item) => sum + (item.period_net_sales ?? 0),
      0,
    )
    const platformShare = platformNet > 0 ? netSales / platformNet : share
    const fees = (settlement?.marketplace_fees ?? 0) * platformShare
    const shipping = (settlement?.shipping_charges ?? 0) * platformShare
    const discounts = (settlement?.discounts ?? group.period_settlement.discounts * share)
    const returns = settlement?.returns ?? group.period_settlement.returns * share
    const grossRevenue =
      settlement?.gross_revenue != null
        ? settlement.gross_revenue * platformShare
        : grossSales || group.period_settlement.gross_revenue * share
    const grossProfit = group.period_gross_profit * share
    const cogs = group.period_cogs * share
    const contribution = group.contribution_margin * share
    const units = member.period_net_units_sold || member.period_gross_units_sold || 0
    const orders = member.period_orders ?? 0

    target.gross_revenue += grossRevenue
    target.discounts += discounts
    target.returns += returns
    target.net_revenue += netSales
    target.order_count += orders
    target.cogs += cogs
    target.gross_profit += grossProfit
    target.platform_fees_total += fees
    target.merchant_shipping_cost += shipping
    target.contribution_margin += contribution
    target.units_sold += units

    total.gross_revenue += grossRevenue
    total.discounts += discounts
    total.returns += returns
    total.net_revenue += netSales
    total.order_count += orders
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
    result[platform.slug] = finishMetrics(byProduct[platform.slug])
  }
  return result
}

function scaleSettlement(
  settlement: ProductLinkGroupSettlementApi,
  share: number,
): ProductLinkGroupSettlementApi {
  return {
    gross_revenue: settlement.gross_revenue * share,
    discounts: settlement.discounts * share,
    returns: settlement.returns * share,
    net_revenue: settlement.net_revenue * share,
    marketplace_fees: settlement.marketplace_fees * share,
    shipping_charges: settlement.shipping_charges * share,
    tax_withholdings: settlement.tax_withholdings * share,
    estimated_payout: settlement.estimated_payout * share,
    completeness: settlement.completeness,
  }
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
    completeness: '',
  }
}

function addSettlementMetrics(
  target: PlatformSettlementMetrics,
  row: ProductLinkGroupSettlementApi,
): void {
  target.gross_revenue += row.gross_revenue
  target.discounts += row.discounts
  target.returns += row.returns
  target.net_revenue += row.net_revenue
  target.marketplace_fees += row.marketplace_fees
  target.shipping_charges += row.shipping_charges
  target.tax_withholdings += row.tax_withholdings
  target.estimated_payout += row.estimated_payout
  if (!target.completeness) target.completeness = row.completeness
}

/**
 * Settlement for the current insight filter.
 * When a single product shares a channel, scale that platform's settlement by
 * the product's share of platform net sales.
 */
export function allocateGroupSettlement(
  group: ProductLinkGroupApi,
  members: ProductLinkGroupMemberApi[],
  allSelected: boolean,
): ProductLinkGroupSettlementApi {
  if (allSelected) return group.period_settlement

  const settlements = new Map(
    (group.period_settlement_by_platform ?? []).map(
      (row) => [row.platform.trim().toLowerCase(), row] as const,
    ),
  )

  if (members.length === 1) {
    const member = members[0]
    const platformSlug = memberPlatformSlug(member)
    const platformSettlement = settlements.get(platformSlug) ?? group.period_settlement
    const platformMembers = group.members.filter(
      (item) => memberPlatformSlug(item) === platformSlug,
    )
    const platformNet = platformMembers.reduce(
      (sum, item) => sum + (item.period_net_sales ?? 0),
      0,
    )
    const memberNet = member.period_net_sales ?? 0
    const platformShare =
      platformNet > 0
        ? memberNet / platformNet
        : group.period_net_sales > 0
          ? memberNet / group.period_net_sales
          : 0
    return scaleSettlement(platformSettlement, platformShare)
  }

  const platforms = new Set(members.map(memberPlatformSlug))
  const rows = (group.period_settlement_by_platform ?? []).filter((row) =>
    platforms.has(row.platform.trim().toLowerCase()),
  )
  if (rows.length === 0) {
    const netSales = members.reduce((sum, member) => sum + (member.period_net_sales ?? 0), 0)
    const share = group.period_net_sales > 0 ? netSales / group.period_net_sales : 0
    return scaleSettlement(group.period_settlement, share)
  }

  const total = emptySettlementMetrics('filtered')
  for (const row of rows) {
    addSettlementMetrics(total, row)
  }
  return {
    gross_revenue: total.gross_revenue,
    discounts: total.discounts,
    returns: total.returns,
    net_revenue: total.net_revenue,
    marketplace_fees: total.marketplace_fees,
    shipping_charges: total.shipping_charges,
    tax_withholdings: total.tax_withholdings,
    estimated_payout: total.estimated_payout,
    completeness: total.completeness || group.period_settlement.completeness,
  }
}

/** Build ChannelsSettlementTable columns from group members (product dimension). */
export function groupProductSettlementMetrics(
  group: ProductLinkGroupApi,
  platforms: ChannelPlatform[],
): Record<string, PlatformSettlementMetrics> {
  const byProduct: Record<string, PlatformSettlementMetrics> = {}
  for (const platform of platforms) {
    byProduct[platform.slug] = emptySettlementMetrics(platform.slug)
  }
  const total = emptySettlementMetrics('total')
  const settlements = new Map(
    (group.period_settlement_by_platform ?? []).map(
      (row) => [row.platform.trim().toLowerCase(), row] as const,
    ),
  )

  for (const member of group.members) {
    const target = byProduct[member.product_id]
    if (!target) continue
    const allocated = allocateGroupSettlement(group, [member], false)
    const platformSlug = memberPlatformSlug(member)
    const completeness =
      settlements.get(platformSlug)?.completeness ?? group.period_settlement.completeness
    addSettlementMetrics(target, { ...allocated, completeness })
    addSettlementMetrics(total, { ...allocated, completeness })
  }

  const result: Record<string, PlatformSettlementMetrics> = {
    total: { ...total, completeness: total.completeness || 'unavailable' },
  }
  for (const platform of platforms) {
    const metrics = byProduct[platform.slug]
    result[platform.slug] = {
      ...metrics,
      completeness: metrics.completeness || 'unavailable',
    }
  }
  return result
}

export function useGroupInsightDimension(group: ProductLinkGroupApi, t: ShellT) {
  const [dimension, setDimension] = useState<GroupInsightDimension>('channel')
  const [channelFilter, setChannelFilter] = useState(PRODUCT_DETAIL_ALL_CHANNELS)
  const [productFilter, setProductFilter] = useState(GROUP_INSIGHT_ALL_PRODUCTS)

  const platformSlugs = useMemo(() => {
    const slugs = new Set<string>()
    for (const member of group.members) {
      const slug = memberPlatformSlug(member)
      if (slug) slugs.add(slug)
    }
    return Array.from(slugs).sort((a, b) => a.localeCompare(b))
  }, [group.members])

  const activeChannel =
    channelFilter === PRODUCT_DETAIL_ALL_CHANNELS || platformSlugs.includes(channelFilter)
      ? channelFilter
      : PRODUCT_DETAIL_ALL_CHANNELS

  const memberIds = useMemo(
    () => new Set(group.members.map((member) => member.product_id)),
    [group.members],
  )
  const activeProduct =
    productFilter === GROUP_INSIGHT_ALL_PRODUCTS || memberIds.has(productFilter)
      ? productFilter
      : GROUP_INSIGHT_ALL_PRODUCTS

  const filteredMembers = useMemo(() => {
    if (dimension === 'product') {
      if (activeProduct === GROUP_INSIGHT_ALL_PRODUCTS) return group.members
      return group.members.filter((member) => member.product_id === activeProduct)
    }
    if (activeChannel === PRODUCT_DETAIL_ALL_CHANNELS) return group.members
    return group.members.filter((member) => memberPlatformSlug(member) === activeChannel)
  }, [activeChannel, activeProduct, dimension, group.members])

  const allSelected =
    dimension === 'product'
      ? activeProduct === GROUP_INSIGHT_ALL_PRODUCTS
      : activeChannel === PRODUCT_DETAIL_ALL_CHANNELS

  const period = useMemo(
    () => filterGroupPeriod(group, filteredMembers, allSelected),
    [allSelected, filteredMembers, group],
  )

  const channelOptions = useMemo((): FilterOption[] => {
    const allOption: FilterOption = {
      value: PRODUCT_DETAIL_ALL_CHANNELS,
      label: t('homeFilterChannelsAll'),
    }
    const platformOptions = platformSlugs.map((slug) => {
      const source =
        group.members.find((member) => memberPlatformSlug(member) === slug)?.platform ?? slug
      return { value: slug, label: productPlatformLabel(source, t) }
    })
    return [allOption, ...platformOptions]
  }, [group.members, platformSlugs, t])

  const productOptions = useMemo((): FilterOption[] => {
    const allOption: FilterOption = {
      value: GROUP_INSIGHT_ALL_PRODUCTS,
      label: t('productsVinculacionFilterProductsAll'),
    }
    const options = group.members.map((member) => ({
      value: member.product_id,
      label: member.variant_label?.trim() || member.title,
    }))
    return [allOption, ...options]
  }, [group.members, t])

  const chartProductIds = useMemo(
    () => filteredMembers.map((member) => member.product_id),
    [filteredMembers],
  )

  const chartConnectionChannel =
    dimension === 'channel' ? activeChannel : PRODUCT_DETAIL_ALL_CHANNELS

  const channelPlatforms = useMemo(() => groupChannelPlatforms(group, t), [group, t])
  const productPlatforms = useMemo(() => groupProductPlatforms(group), [group])

  const pnlPlatforms = dimension === 'product' ? productPlatforms : channelPlatforms
  const pnlMetrics = useMemo(
    () =>
      dimension === 'product'
        ? groupProductPnlMetrics(group, productPlatforms)
        : groupChannelPnlMetrics(group, channelPlatforms),
    [channelPlatforms, dimension, group, productPlatforms],
  )

  const settlement = useMemo(
    () => allocateGroupSettlement(group, filteredMembers, allSelected),
    [allSelected, filteredMembers, group],
  )

  return {
    dimension,
    setDimension,
    channelFilter: activeChannel,
    setChannelFilter,
    productFilter: activeProduct,
    setProductFilter,
    filteredMembers,
    allSelected,
    period,
    settlement,
    channelOptions,
    productOptions,
    chartProductIds,
    chartConnectionChannel,
    connectionIdsForActive: (connections: Parameters<typeof connectionIdsForPlatform>[0]) =>
      connectionIdsForPlatform(connections, chartConnectionChannel),
    pnlPlatforms,
    pnlMetrics,
  }
}

export type GroupInsightDimensionState = ReturnType<typeof useGroupInsightDimension>
