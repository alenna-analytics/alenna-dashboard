import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi } from '@/lib/types/catalog'

import { displayStockQuantity } from './product-stock-alert-ui'

type ListingInventoryInput = Pick<
  ProductListingApi,
  'inventory_days' | 'stock_quantity' | 'velocity_units_per_day_90d'
>

type ListingPublicationInput = Pick<
  ProductListingApi,
  'platform' | 'platform_variant_id' | 'platform_price' | 'currency'
>

/** Mercado Libre item ids (MLM123…) → `#123` for seller-center parity. */
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
  return raw
}

function formatListingNativePrice(price: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

export function formatListingPublicationSubtitle(listing: ListingPublicationInput): string | null {
  const variantLabel = formatPlatformListingVariantLabel(
    listing.platform,
    listing.platform_variant_id,
  )
  const parts: string[] = []
  if (variantLabel) parts.push(variantLabel)
  if (listing.platform_price != null && listing.platform_price > 0) {
    parts.push(formatListingNativePrice(listing.platform_price, listing.currency ?? 'MXN'))
  }
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
