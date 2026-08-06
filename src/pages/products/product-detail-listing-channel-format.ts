import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi } from '@/lib/types/catalog'

import { displayStockQuantity } from './product-stock-alert-ui'

type ListingInventoryInput = Pick<
  ProductListingApi,
  'inventory_days' | 'stock_quantity' | 'velocity_units_per_day_90d'
>

type ListingPublicationInput = Pick<
  ProductListingApi,
  'platform' | 'platform_variant_id' | 'platform_sku' | 'platform_price' | 'currency'
>

export const LISTING_LABEL_TRUNCATE_LEN = 20

export function truncateListingLabel(label: string, maxLen = LISTING_LABEL_TRUNCATE_LEN): string {
  if (label.length <= maxLen) return label
  return `${label.slice(0, maxLen)}…`
}

/** Prefer catalog variant id; fall back to gid embedded in Shopify SKU. */
export function resolveListingVariantId(
  listing: Pick<ProductListingApi, 'platform' | 'platform_variant_id' | 'platform_sku'>,
): string | null {
  const variantId = listing.platform_variant_id?.trim()
  if (variantId) return variantId
  const sku = listing.platform_sku?.trim() ?? ''
  if (listing.platform === 'shopify' && sku.includes('ProductVariant/')) return sku
  return null
}

/** Short, human-readable listing key (Meli/Shopify → `#123…`, Amazon → ASIN). */
export function formatPlatformListingVariantLabel(
  platform: string,
  variantId: string | null | undefined,
): string | null {
  const raw = variantId?.trim()
  if (!raw) return null

  if (platform === 'mercadolibre') {
    const digits = raw.match(/(\d{6,})$/)?.[1]
    return digits ? `#${digits}` : `#${raw}`
  }

  if (platform === 'shopify') {
    const gidDigits = raw.match(/ProductVariant\/(\d+)$/i)?.[1]
    if (gidDigits) return `#${gidDigits}`
    const digits = raw.match(/(\d{6,})$/)?.[1]
    return digits ? `#${digits}` : raw
  }

  return raw
}

export function formatListingNativePrice(
  price: number | null | undefined,
  currency: string | null | undefined,
): string | null {
  if (price == null || price <= 0) return null
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency ?? 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

export type ListingPublicationDisplay = {
  variantLabel: string | null
  variantTooltip: string | null
  listPrice: string | null
}

export function formatListingPublicationDisplay(
  listing: ListingPublicationInput,
): ListingPublicationDisplay {
  const variantSource = resolveListingVariantId(listing)
  const variantLabel = formatPlatformListingVariantLabel(listing.platform, variantSource)
  const listPrice = formatListingNativePrice(listing.platform_price, listing.currency)
  return {
    variantLabel,
    variantTooltip: variantSource,
    listPrice,
  }
}

/** @deprecated Use formatListingPublicationDisplay — kept for settlement sheet one-liner. */
export function formatListingPublicationSubtitle(listing: ListingPublicationInput): string | null {
  const { variantLabel, listPrice } = formatListingPublicationDisplay(listing)
  const parts: string[] = []
  if (variantLabel) parts.push(variantLabel)
  if (listPrice) parts.push(listPrice)
  return parts.length > 0 ? parts.join(' · ') : null
}

export function formatListingVelocityPerDay(velocity: number | null | undefined): string {
  if (velocity == null || velocity <= 0) return '—'
  return velocity.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function formatListingInventoryDays(
  listing: ListingInventoryInput,
  t: (key: ShellStringKey) => string,
): string {
  const stock = displayStockQuantity(listing.stock_quantity)
  if (stock === null) {
    return t('productsDetailKpiNoData')
  }
  if (listing.inventory_days === null) {
    const noVelocity =
      listing.velocity_units_per_day_90d === null || listing.velocity_units_per_day_90d <= 0
    if (stock > 0 && noVelocity) {
      return t('productsDetailKpiInventoryDaysNoSales')
    }
    return t('productsDetailKpiNoData')
  }
  return listing.inventory_days.toLocaleString()
}
