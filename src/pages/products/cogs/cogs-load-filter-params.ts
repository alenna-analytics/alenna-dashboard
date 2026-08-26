import type { ProductsListFiltersState } from '@/pages/products/products-list-filter-state'
import { normalizeStockAlertLevelsFilter } from '@/pages/products/products-list-filter-state'

export function buildCogsLoadFilterSearchParams(
  q: string,
  filters: ProductsListFiltersState,
  page: { limit: number; offset: number },
): URLSearchParams {
  const sp = new URLSearchParams()
  const trimmed = q.trim()
  if (trimmed) sp.set('q', trimmed)
  for (const s of filters.statuses) sp.append('status', s)
  for (const p of filters.platforms) sp.append('platform', p)
  for (const level of normalizeStockAlertLevelsFilter(filters.stockAlertLevels)) {
    sp.append('stock_alert', level)
  }
  sp.set('limit', String(page.limit))
  sp.set('offset', String(page.offset))
  return sp
}

export function cogsLoadHasActiveFilters(q: string, filters: ProductsListFiltersState): boolean {
  return (
    q.trim().length > 0 ||
    filters.platforms.length > 0 ||
    filters.statuses.length > 0 ||
    filters.stockAlertLevels.length > 0
  )
}

export function buildAddByFilterBody(
  q: string,
  filters: ProductsListFiltersState,
  addAll: boolean,
  page: { limit: number; offset: number },
  excludeProductIds?: string[],
) {
  const stockAlert = normalizeStockAlertLevelsFilter(filters.stockAlertLevels)
  const body = {
    add_all: addAll,
    q: q.trim() || undefined,
    status: filters.statuses.length ? filters.statuses : undefined,
    platform: filters.platforms.length ? filters.platforms : undefined,
    stock_alert: stockAlert.length ? stockAlert : undefined,
    cost_missing: undefined as boolean | undefined,
    exclude_product_ids:
      excludeProductIds && excludeProductIds.length > 0 ? excludeProductIds : undefined,
  }
  if (!addAll) {
    return { ...body, limit: page.limit, offset: page.offset }
  }
  return body
}
