import { describe, expect, it } from 'vitest'

import type { BulkCogsDraft } from '../bulk-cogs-types'
import {
  computeDraftTotal,
  draftValuesChanged,
  patchDraftField,
  resolveDraftCostValues,
  validateDraftRow,
} from '../bulk-cogs-validation'

function baseDraft(overrides: Partial<BulkCogsDraft> = {}): BulkCogsDraft {
  return {
    productId: 'p1',
    parentProductId: null,
    parentTitle: 'Product',
    variantLabel: null,
    internalSku: null,
    baseCurrency: 'MXN',
    serverSupplier: 100,
    serverFreight: 10,
    serverPackaging: 5,
    serverTotal: 115,
    supplierDraft: '100',
    freightDraft: '10',
    packagingDraft: '5',
    dirty: false,
    invalid: false,
    ...overrides,
  }
}

describe('bulk-cogs-validation', () => {
  it('allows supplier only with empty freight and shipping', () => {
    const draft = validateDraftRow(
      baseDraft({ supplierDraft: '120', freightDraft: '', packagingDraft: '' }),
    )
    expect(draft.invalid).toBe(false)
    expect(computeDraftTotal(draft)).toBe(120)
    expect(resolveDraftCostValues(draft)).toEqual({
      supplier: 120,
      freight: 0,
      packaging: 0,
    })
  })

  it('requires supplier when freight or shipping is filled', () => {
    const draft = validateDraftRow(
      baseDraft({ supplierDraft: '', freightDraft: '8', packagingDraft: '' }),
    )
    expect(draft.invalid).toBe(true)
  })

  it('requires supplier when shipping is filled', () => {
    const draft = validateDraftRow(
      baseDraft({ supplierDraft: '', freightDraft: '', packagingDraft: '3' }),
    )
    expect(draft.invalid).toBe(true)
  })

  it('allows freight and shipping when supplier is present', () => {
    const draft = validateDraftRow(
      baseDraft({ supplierDraft: '50', freightDraft: '2', packagingDraft: '1' }),
    )
    expect(draft.invalid).toBe(false)
    expect(resolveDraftCostValues(draft)).toEqual({
      supplier: 50,
      freight: 2,
      packaging: 1,
    })
  })

  it('marks malformed optional fields invalid', () => {
    const draft = validateDraftRow(
      baseDraft({ supplierDraft: '50', freightDraft: 'abc', packagingDraft: '' }),
    )
    expect(draft.invalid).toBe(true)
  })

  it('treats empty optional fields as unchanged zero values', () => {
    const draft = baseDraft({
      serverFreight: 0,
      serverPackaging: 0,
      freightDraft: '',
      packagingDraft: '',
    })
    expect(draftValuesChanged(draft)).toBe(false)
  })

  it('requires supplier on any changed row', () => {
    const draft = patchDraftField(
      baseDraft({ supplierDraft: '100' }),
      'supplierDraft',
      '',
    )
    expect(draft.dirty).toBe(true)
    expect(draft.invalid).toBe(true)
  })
})
