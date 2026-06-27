import { validateDraftRow } from '@/pages/products/bulk-cogs/bulk-cogs-validation'
import type { BulkCogsDraftStore } from '@/pages/products/bulk-cogs/bulk-cogs-draft-store'

export type CogsLoadItemReadiness = 'ready' | 'invalid' | 'empty'

export function classifyLoadDraft(draft: ReturnType<typeof validateDraftRow>): CogsLoadItemReadiness {
  const validated = validateDraftRow(draft)
  if (validated.invalid) return 'invalid'
  if (!validated.supplierDraft.trim()) return 'empty'
  return 'ready'
}

export function countLoadReviewStates(store: BulkCogsDraftStore): {
  total: number
  ready: number
  invalid: number
  empty: number
} {
  let ready = 0
  let invalid = 0
  let empty = 0
  for (const draft of store.values()) {
    const state = classifyLoadDraft(draft)
    if (state === 'ready') ready += 1
    else if (state === 'invalid') invalid += 1
    else empty += 1
  }
  return { total: store.size, ready, invalid, empty }
}
