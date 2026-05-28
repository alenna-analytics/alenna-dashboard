import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'

type InventoryDaysInput = Pick<
  ProductDetailApi,
  'inventory_days' | 'consolidated_stock_quantity' | 'velocity_units_per_day_90d'
>

export function formatInventoryDays(
  detail: InventoryDaysInput,
  t: (key: ShellStringKey) => string,
): string {
  if (detail.consolidated_stock_quantity === null) {
    return t('productsDetailKpiNoData')
  }
  if (detail.inventory_days === null) {
    const noVelocity =
      detail.velocity_units_per_day_90d === null || detail.velocity_units_per_day_90d <= 0
    if (detail.consolidated_stock_quantity > 0 && noVelocity) {
      return t('productsDetailKpiInventoryDaysNoSales')
    }
    return t('productsDetailKpiNoData')
  }
  return `${detail.inventory_days.toLocaleString()} ${t('productsDetailKpiInventoryDaysSuffix')}`
}
