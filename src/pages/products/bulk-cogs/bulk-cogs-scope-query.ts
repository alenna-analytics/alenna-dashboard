import type { BulkCogsScope } from './bulk-cogs-types'

const BULK_PAGE_SIZE = 200

export { BULK_PAGE_SIZE }

export function bulkScopeToQueryParams(scope: BulkCogsScope, page: number): URLSearchParams {
  const sp = new URLSearchParams({
    limit: String(BULK_PAGE_SIZE),
    offset: String(page * BULK_PAGE_SIZE),
  })
  if (scope.mode === 'parents') {
    for (const id of scope.parentProductIds) {
      sp.append('parent_product_ids', id)
    }
    return sp
  }
  const { filters, excludeParentIds } = scope
  if (filters.q.trim()) sp.set('q', filters.q.trim())
  for (const st of filters.statuses) {
    if (st === 'active' || st === 'inactive') sp.append('status', st)
  }
  for (const plat of filters.platforms) {
    if (plat.trim()) sp.append('platform', plat.trim().toLowerCase())
  }
  for (const level of filters.stockAlertLevels) {
    sp.append('stock_alert', level)
  }
  if (filters.costMissing === true) sp.set('cost_missing', 'true')
  if (filters.costMissing === false) sp.set('cost_missing', 'false')
  for (const id of excludeParentIds ?? []) {
    sp.append('exclude_parent_ids', id)
  }
  return sp
}

export function bulkScopeLabelKey(scope: BulkCogsScope): 'productsBulkCogsScopeFilter' | 'productsBulkCogsScopeParents' | 'productsBulkCogsScopeFilterExclude' {
  if (scope.mode === 'parents') return 'productsBulkCogsScopeParents'
  if (scope.excludeParentIds?.length) return 'productsBulkCogsScopeFilterExclude'
  return 'productsBulkCogsScopeFilter'
}
