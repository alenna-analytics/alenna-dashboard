import { describe, expect, it } from 'vitest'

import { distinctVariantLabel, splitDisplayTitle } from '../cogs-load-product-label'

describe('distinctVariantLabel', () => {
  it('hides empty, default, and duplicated titles', () => {
    expect(distinctVariantLabel('Equilibrio - Gotero', null)).toBeNull()
    expect(distinctVariantLabel('Equilibrio - Gotero', 'Default Title')).toBeNull()
    expect(distinctVariantLabel('Equilibrio - Gotero', 'Equilibrio - Gotero')).toBeNull()
  })

  it('keeps a real option label', () => {
    expect(distinctVariantLabel('Flow - Cápsulas', '120 cápsulas')).toBe('120 cápsulas')
  })

  it('strips a repeated parent prefix from the variant title', () => {
    expect(
      distinctVariantLabel(
        'FLOW - MELENA DE LEÓN',
        'FLOW - MELENA DE LEÓN (EXTRACTO LÍQUIDO)',
      ),
    ).toBe('EXTRACTO LÍQUIDO')
  })
})

describe('splitDisplayTitle', () => {
  it('splits a catalog em-dash title into parent and variant', () => {
    expect(splitDisplayTitle('Flow - Cápsulas — 120 cápsulas')).toEqual({
      parentTitle: 'Flow - Cápsulas',
      variantLabel: '120 cápsulas',
    })
  })

  it('keeps a plain title without a variant', () => {
    expect(splitDisplayTitle('Equilibrio - Gotero')).toEqual({
      parentTitle: 'Equilibrio - Gotero',
      variantLabel: null,
    })
  })
})
