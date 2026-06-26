import type { StockAlertLevel } from '@/lib/types/catalog'

export type BulkCogsFilterScope = {
  q: string
  statuses: string[]
  platforms: string[]
  stockAlertLevels: StockAlertLevel[]
  costMissing?: boolean
}

export type BulkCogsScope =
  | {
      mode: 'filter'
      filters: BulkCogsFilterScope
      excludeParentIds?: string[]
    }
  | {
      mode: 'parents'
      parentProductIds: string[]
    }

export type BulkCogsDraft = {
  productId: string
  parentProductId: string | null
  parentTitle: string
  variantLabel: string | null
  internalSku: string | null
  baseCurrency: string
  serverSupplier: number | null
  serverFreight: number | null
  serverPackaging: number | null
  serverTotal: number | null
  supplierDraft: string
  freightDraft: string
  packagingDraft: string
  dirty: boolean
  invalid: boolean
}

export type BulkCogsApplyUiMode = 'today' | 'from_date' | 'range'

export type BulkCogsApplyApiPayload = {
  effective_from: string
  apply_mode: 'forward' | 'backfill'
  effective_to: string | null
}
