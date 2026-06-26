import { computeCogsTotal } from '../product-cost-breakdown'
import { parseCostInput } from '../product-cost-input-utils'
import type { BulkCogsDraft } from './bulk-cogs-types'

const ZERO_DUTIES = { mode: 'fixed' as const, value: 0 }

type OptionalCostParse = {
  value: number
  invalid: boolean
  filled: boolean
}

function parseOptionalCostField(raw: string): OptionalCostParse {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { value: 0, invalid: false, filled: false }
  }
  const parsed = parseCostInput(raw)
  if (parsed === null) {
    return { value: 0, invalid: true, filled: true }
  }
  return { value: parsed, invalid: false, filled: true }
}

function serverOrZero(value: number | null): number {
  return value ?? 0
}

function valuesClose(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.00005
}

export function validateDraftRow(draft: BulkCogsDraft): BulkCogsDraft {
  const supplierParsed = parseCostInput(draft.supplierDraft)
  const supplierFilled = draft.supplierDraft.trim() !== ''
  const freight = parseOptionalCostField(draft.freightDraft)
  const packaging = parseOptionalCostField(draft.packagingDraft)

  const invalid =
    freight.invalid ||
    packaging.invalid ||
    (supplierFilled && supplierParsed === null) ||
    ((freight.filled || packaging.filled) && supplierParsed === null)

  return { ...draft, invalid }
}

export function computeDraftTotal(draft: BulkCogsDraft): number | null {
  const supplier = parseCostInput(draft.supplierDraft)
  if (supplier === null) return null
  const freight = parseOptionalCostField(draft.freightDraft)
  const packaging = parseOptionalCostField(draft.packagingDraft)
  if (freight.invalid || packaging.invalid) return null
  return computeCogsTotal({
    supplierPrice: supplier,
    freight: { mode: 'fixed', value: freight.value },
    duties: ZERO_DUTIES,
    packagingValue: packaging.value,
  })
}

export function draftValuesChanged(draft: BulkCogsDraft): boolean {
  const supplierParsed = parseCostInput(draft.supplierDraft)
  const freight = parseOptionalCostField(draft.freightDraft)
  const packaging = parseOptionalCostField(draft.packagingDraft)

  if (freight.invalid || packaging.invalid) return true
  if (draft.supplierDraft.trim() !== '' && supplierParsed === null) return true

  if (supplierParsed === null) {
    return (
      freight.filled ||
      packaging.filled ||
      !valuesClose(freight.value, serverOrZero(draft.serverFreight)) ||
      !valuesClose(packaging.value, serverOrZero(draft.serverPackaging))
    )
  }

  return !(
    valuesClose(supplierParsed, serverOrZero(draft.serverSupplier)) &&
    valuesClose(freight.value, serverOrZero(draft.serverFreight)) &&
    valuesClose(packaging.value, serverOrZero(draft.serverPackaging))
  )
}

export function resolveDraftCostValues(
  draft: BulkCogsDraft,
): { supplier: number; freight: number; packaging: number } | null {
  if (draft.invalid) return null
  const supplier = parseCostInput(draft.supplierDraft)
  if (supplier === null) return null
  const freight = parseOptionalCostField(draft.freightDraft)
  const packaging = parseOptionalCostField(draft.packagingDraft)
  if (freight.invalid || packaging.invalid) return null
  return {
    supplier,
    freight: freight.value,
    packaging: packaging.value,
  }
}

export function patchDraftField(
  draft: BulkCogsDraft,
  field: 'supplierDraft' | 'freightDraft' | 'packagingDraft',
  value: string,
): BulkCogsDraft {
  const next = validateDraftRow({ ...draft, [field]: value })
  const dirty = draftValuesChanged(next)
  const needsSupplier = dirty && parseCostInput(next.supplierDraft) === null
  return { ...next, dirty, invalid: next.invalid || needsSupplier }
}
