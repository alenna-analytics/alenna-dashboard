import type { StockAlertLevel } from '@/lib/types/catalog'

/** Alert levels exposed in the products list filter (extend when new levels exist). */
export const PRODUCT_STOCK_ALERT_FILTER_LEVELS: readonly StockAlertLevel[] = [
  'out',
  'low',
  'none',
]

export type ProductsListFiltersState = {
  statuses: string[]
  stockAlertLevels: string[]
  platforms: string[]
}

export const EMPTY_PRODUCTS_LIST_FILTERS: ProductsListFiltersState = {
  statuses: [],
  stockAlertLevels: [],
  platforms: [],
}

export function normalizeStockAlertLevelsFilter(
  selected: readonly string[],
): StockAlertLevel[] {
  const allowed = new Set<StockAlertLevel>(PRODUCT_STOCK_ALERT_FILTER_LEVELS)
  const out: StockAlertLevel[] = []
  for (const value of selected) {
    if (allowed.has(value as StockAlertLevel) && !out.includes(value as StockAlertLevel)) {
      out.push(value as StockAlertLevel)
    }
  }
  return out
}
