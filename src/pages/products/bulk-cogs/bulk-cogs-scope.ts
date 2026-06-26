import type { BulkCogsScope } from './bulk-cogs-types'

export const BULK_COGS_SCOPE_STORAGE_KEY = 'alenna.products.bulk-cogs.scope.v1'

export function writeBulkCogsScope(scope: BulkCogsScope): void {
  sessionStorage.setItem(BULK_COGS_SCOPE_STORAGE_KEY, JSON.stringify(scope))
}

export function readBulkCogsScope(): BulkCogsScope | null {
  const raw = sessionStorage.getItem(BULK_COGS_SCOPE_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as BulkCogsScope
    if (parsed.mode === 'filter' || parsed.mode === 'parents') return parsed
  } catch {
    return null
  }
  return null
}

export function clearBulkCogsScope(): void {
  sessionStorage.removeItem(BULK_COGS_SCOPE_STORAGE_KEY)
}
