import { formatCostDraft } from '../product-cost-input-utils'
import type { BulkCogsDraft } from './bulk-cogs-types'
import type { ProductCostBulkRowApi } from '@/lib/types/catalog'

export type BulkCogsDraftStore = Map<string, BulkCogsDraft>

export function createDraftFromRow(row: ProductCostBulkRowApi, baseCurrency: string): BulkCogsDraft {
  return {
    productId: row.product_id,
    parentProductId: row.parent_product_id,
    parentTitle: row.parent_title,
    variantLabel: row.variant_label,
    internalSku: row.internal_sku,
    baseCurrency,
    serverSupplier: row.supplier_price,
    serverFreight: row.freight_value,
    serverPackaging: row.packaging_value,
    serverTotal: row.computed_total,
    supplierDraft: formatCostDraft(row.supplier_price),
    freightDraft: formatCostDraft(row.freight_value),
    packagingDraft: formatCostDraft(row.packaging_value),
    dirty: false,
    invalid: false,
  }
}

export function mergeRowsIntoDraftStore(
  store: BulkCogsDraftStore,
  rows: ProductCostBulkRowApi[],
  baseCurrency: string,
): BulkCogsDraftStore {
  const next = new Map(store)
  for (const row of rows) {
    if (next.has(row.product_id)) continue
    next.set(row.product_id, createDraftFromRow(row, baseCurrency))
  }
  return next
}

export function listChangedDrafts(store: BulkCogsDraftStore): BulkCogsDraft[] {
  return [...store.values()].filter((d) => d.dirty)
}

export function countDraftStates(store: BulkCogsDraftStore): {
  changed: number
  invalid: number
  unchanged: number
} {
  let changed = 0
  let invalid = 0
  let unchanged = 0
  for (const draft of store.values()) {
    if (draft.invalid) {
      invalid += 1
      if (draft.dirty) changed += 1
    } else if (draft.dirty) {
      changed += 1
    } else {
      unchanged += 1
    }
  }
  return { changed, invalid, unchanged }
}
