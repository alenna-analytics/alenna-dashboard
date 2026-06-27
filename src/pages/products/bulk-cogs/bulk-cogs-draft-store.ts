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

export function createDraftFromLoadItem(
  item: {
    product_id: string
    parent_product_id: string | null
    parent_title: string
    variant_label: string | null
    internal_sku: string | null
    supplier_price: number | null
    freight_value: number | null
    packaging_value: number | null
    computed_total: number | null
  },
  baseCurrency: string,
): BulkCogsDraft {
  return createDraftFromRow(
    {
      product_id: item.product_id,
      parent_product_id: item.parent_product_id,
      parent_title: item.parent_title,
      variant_label: item.variant_label,
      internal_sku: item.internal_sku,
      cost_missing: false,
      supplier_price: item.supplier_price,
      freight_value: item.freight_value,
      packaging_value: item.packaging_value,
      computed_total: item.computed_total,
    },
    baseCurrency,
  )
}

export function mergeLoadItemsIntoDraftStore(
  store: BulkCogsDraftStore,
  items: Parameters<typeof createDraftFromLoadItem>[0][],
  baseCurrency: string,
): BulkCogsDraftStore {
  const next = new Map(store)
  const incomingIds = new Set(items.map((item) => item.product_id))
  for (const key of [...next.keys()]) {
    if (!incomingIds.has(key)) next.delete(key)
  }
  for (const item of items) {
    next.set(item.product_id, createDraftFromLoadItem(item, baseCurrency))
  }
  return next
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
