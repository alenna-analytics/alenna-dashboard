import type { ProductDetailApi } from '@/lib/types/catalog'

export const PRODUCT_DETAIL_ALL_CHANNELS = 'all'

export type ProductDetailFilteredPeriod = {
  period_gross_sales: number
  period_net_sales: number
  period_gross_profit: number
  net_profit: number
  period_units_sold: number
  period_orders: number
  contribution_margin_pct: number
  inventory_days: number | null
}

export function platformSlugsFromDetail(detail: ProductDetailApi): string[] {
  const slugs = new Set<string>()
  for (const row of detail.period_by_platform ?? []) {
    slugs.add(row.platform.trim().toLowerCase())
  }
  for (const listing of detail.listings) {
    slugs.add(listing.platform.trim().toLowerCase())
  }
  return Array.from(slugs).sort((a, b) => a.localeCompare(b))
}

export function filteredProductDetailPeriod(
  detail: ProductDetailApi,
  channelFilter: string,
): ProductDetailFilteredPeriod {
  if (channelFilter === PRODUCT_DETAIL_ALL_CHANNELS) {
    return {
      period_gross_sales: detail.period_gross_sales,
      period_net_sales: detail.period_net_sales,
      period_gross_profit: detail.period_gross_profit,
      net_profit: detail.gross_profit,
      period_units_sold: detail.period_gross_units_sold ?? detail.period_units_sold,
      period_orders: detail.period_orders,
      contribution_margin_pct: Number(detail.gross_margin_pct),
      inventory_days: detail.inventory_days,
    }
  }

  const slug = channelFilter.trim().toLowerCase()
  const platformRow = detail.period_by_platform.find(
    (row) => row.platform.trim().toLowerCase() === slug,
  )
  const platformListings = detail.listings.filter(
    (listing) => listing.platform.trim().toLowerCase() === slug,
  )

  const grossSales = platformRow?.gross_sales ?? platformRow?.sales ?? 0
  const netSales = platformRow?.net_sales ?? platformRow?.sales ?? 0
  const units =
    platformRow?.gross_units_sold ??
    platformRow?.units_sold ??
    platformListings.reduce((sum, listing) => sum + listing.period_units_sold, 0)
  const orders = platformListings.reduce((sum, listing) => sum + listing.period_orders, 0)

  const totalGross = detail.period_gross_sales
  const cogsShare = totalGross > 0 ? detail.period_cogs * (grossSales / totalGross) : 0
  const grossProfit = grossSales - cogsShare
  const netProfit = netSales - cogsShare
  const contributionMarginPct = netSales !== 0 ? (netProfit / netSales) * 100 : 0

  return {
    period_gross_sales: grossSales,
    period_net_sales: netSales,
    period_gross_profit: grossProfit,
    net_profit: netProfit,
    period_units_sold: units,
    period_orders: orders,
    contribution_margin_pct: contributionMarginPct,
    inventory_days: detail.inventory_days,
  }
}

export function connectionIdsForPlatform(
  connections: ReadonlyArray<{ id: string; platform: string }> | undefined,
  channelFilter: string,
): string[] | undefined {
  if (channelFilter === PRODUCT_DETAIL_ALL_CHANNELS) return undefined
  const slug = channelFilter.trim().toLowerCase()
  const ids =
    connections
      ?.filter((connection) => connection.platform.trim().toLowerCase() === slug)
      .map((connection) => connection.id) ?? []
  return ids.length > 0 ? ids : undefined
}
