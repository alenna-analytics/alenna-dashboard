import { describe, expect, it } from 'vitest'

import { computeCogsTotal } from '../product-cost-breakdown'

describe('computeCogsTotal', () => {
  it('sums fixed components', () => {
    expect(
      computeCogsTotal({
        supplierPrice: 10,
        freight: { mode: 'fixed', value: 2 },
        duties: { mode: 'fixed', value: 1.2 },
        packagingValue: 0.5,
      }),
    ).toBe(13.7)
  })

  it('applies landed-cost percent on supplier and dutiable base', () => {
    expect(
      computeCogsTotal({
        supplierPrice: 100,
        freight: { mode: 'percent', value: 5 },
        duties: { mode: 'percent', value: 10 },
        packagingValue: 0,
      }),
    ).toBe(115.5)
  })

  it('uses fixed freight when mode is fixed', () => {
    expect(
      computeCogsTotal({
        supplierPrice: 100,
        freight: { mode: 'fixed', value: 3 },
        duties: { mode: 'percent', value: 10 },
        packagingValue: 0,
      }),
    ).toBe(113.3)
  })
})
