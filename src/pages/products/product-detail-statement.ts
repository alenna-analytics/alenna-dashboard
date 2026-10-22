import type { ProductDetailApi, ProductListingApi, ProductPlatformPeriodApi } from '@/lib/types/catalog'
import type { TaxSettingsRates } from '@/lib/types/tax-settings'

import { PRODUCT_DETAIL_ALL_CHANNELS } from './product-detail-analytics-filter'
import {
  buildGroupStatement,
  finalizeGroupStatement,
  type GroupStatementMember,
  type GroupStatementPlatform,
} from './vinculacion/group-statement'

function slug(platform: string): string {
  return platform.trim().toLowerCase()
}

function unitCogs(detail: ProductDetailApi): number | null {
  if (detail.period_net_units_sold > 0 && Number.isFinite(detail.period_cogs)) {
    return detail.period_cogs / detail.period_net_units_sold
  }
  if (detail.cost != null && Number.isFinite(detail.cost)) return detail.cost
  return null
}

function listingMember(listing: ProductListingApi, cost: number | null): GroupStatementMember {
  const settlement = listing.period_settlement
  const units = listing.period_units_sold
  return {
    productId: listing.id,
    platform: listing.platform,
    label: listing.platform_title?.trim() || listing.platform_sku || listing.platform,
    grossSales: settlement?.gross_revenue ?? listing.period_sales,
    netSales: settlement?.net_revenue ?? listing.period_sales,
    grossUnits: units,
    netUnits: units,
    cost,
    hasSettlement: settlement != null,
    cogs: cost != null ? units * cost : null,
    settlementGross: settlement?.gross_revenue ?? listing.period_sales,
    settlementNet: settlement?.net_revenue ?? listing.period_sales,
    discounts: settlement?.discounts ?? 0,
    returns: settlement?.returns ?? 0,
    fees: settlement?.marketplace_fees ?? 0,
    shipping: settlement?.shipping_charges ?? 0,
    taxReal: settlement?.tax_withholdings ?? 0,
    cancelCost: settlement?.platform_cancel_costs?.total ?? 0,
  }
}

function platformMember(
  detail: ProductDetailApi,
  row: ProductPlatformPeriodApi,
  cost: number | null,
): GroupStatementMember {
  const settlement = (detail.period_settlement_by_platform ?? []).find(
    (item) => slug(item.platform) === slug(row.platform),
  )
  return {
    productId: slug(row.platform),
    platform: row.platform,
    label: row.platform,
    grossSales: row.gross_sales,
    netSales: row.net_sales,
    grossUnits: row.gross_units_sold,
    netUnits: row.net_units_sold,
    cost,
    hasSettlement: settlement != null,
    cogs: cost != null ? row.net_units_sold * cost : null,
    settlementGross: settlement?.gross_revenue ?? row.gross_sales,
    settlementNet: settlement?.net_revenue ?? row.net_sales,
    discounts: settlement?.discounts ?? 0,
    returns: settlement?.returns ?? 0,
    fees: settlement?.marketplace_fees ?? 0,
    shipping: settlement?.shipping_charges ?? 0,
    taxReal: settlement?.tax_withholdings ?? 0,
    cancelCost: settlement?.platform_cancel_costs?.total ?? 0,
  }
}

export function productStatement(
  detail: ProductDetailApi,
  mode: 'channel' | 'publication',
  channelFilter: string,
  labelForPlatform: (platform: string) => string,
  rates: TaxSettingsRates | null,
) {
  const cost = unitCogs(detail)
  const selected = (platform: string) =>
    channelFilter === PRODUCT_DETAIL_ALL_CHANNELS || slug(platform) === channelFilter
  const members =
    detail.listings.length > 0
      ? detail.listings.filter((listing) => selected(listing.platform)).map((listing) => listingMember(listing, cost))
      : (detail.period_by_platform ?? [])
          .filter((row) => selected(row.platform))
          .map((row) => platformMember(detail, row, cost))
  const platforms: GroupStatementPlatform[] = (detail.period_settlement_by_platform ?? [])
    .filter((row) => selected(row.platform))
    .map((row) => ({
      platform: row.platform,
      gross: row.gross_revenue,
      discounts: row.discounts,
      returns: row.returns,
      net: row.net_revenue,
      fees: row.marketplace_fees,
      shipping: row.shipping_charges,
      taxReal: row.tax_withholdings,
      cancelCost: row.platform_cancel_costs?.total ?? 0,
    }))
  const built = buildGroupStatement({
    members,
    platforms,
    mode,
    labelForPlatform,
  })
  return finalizeGroupStatement(built.columns, rates)
}
