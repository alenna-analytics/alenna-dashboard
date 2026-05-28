import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi } from '@/lib/types/catalog'

import { displayStockQuantity } from './product-stock-alert-ui'

type ListingInventoryInput = Pick<
  ProductListingApi,
  'inventory_days' | 'stock_quantity' | 'velocity_units_per_day_90d'
>

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
