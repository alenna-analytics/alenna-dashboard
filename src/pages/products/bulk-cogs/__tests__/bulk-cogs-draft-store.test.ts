import { describe, expect, it } from 'vitest'

import {
  createDraftFromLoadItem,
  syncLoadDraftStoreMembership,
  type BulkCogsDraftStore,
} from '../bulk-cogs-draft-store'

function loadItem(productId: string, supplier: number) {
  return {
    product_id: productId,
    parent_product_id: null,
    parent_title: 'Product',
    variant_label: null,
    internal_sku: null,
    supplier_price: supplier,
    freight_value: 0,
    packaging_value: 0,
    computed_total: supplier,
  }
}

describe('syncLoadDraftStoreMembership', () => {
  it('keeps in-progress drafts when the load snapshot refreshes', () => {
    const store: BulkCogsDraftStore = new Map([
      [
        'a',
        {
          ...createDraftFromLoadItem(loadItem('a', 10), 'MXN'),
          supplierDraft: '99',
        },
      ],
    ])

    const next = syncLoadDraftStoreMembership(
      store,
      [loadItem('a', 10), loadItem('b', 20)],
      'MXN',
    )

    expect(next.get('a')?.supplierDraft).toBe('99')
    expect(next.get('b')?.supplierDraft).toBe('20')
    expect(next.has('a')).toBe(true)
    expect(next.size).toBe(2)
  })

  it('drops drafts that left the load', () => {
    const store: BulkCogsDraftStore = new Map([
      ['a', createDraftFromLoadItem(loadItem('a', 10), 'MXN')],
      ['gone', createDraftFromLoadItem(loadItem('gone', 1), 'MXN')],
    ])

    const next = syncLoadDraftStoreMembership(store, [loadItem('a', 10)], 'MXN')
    expect([...next.keys()]).toEqual(['a'])
  })
})
