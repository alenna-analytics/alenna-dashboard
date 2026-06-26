import { describe, expect, it } from 'vitest'

import {
  costsEqual,
  parseCostInput,
  roundCostInput,
} from '@/pages/products/product-cost-input-utils'

describe('product-cost-input-utils', () => {
  it('rounds to four decimal places', () => {
    expect(roundCostInput(12.345678)).toBe(12.3457)
  })

  it('parses valid non-negative numbers', () => {
    expect(parseCostInput(' 12.5 ')).toBe(12.5)
    expect(parseCostInput('0')).toBe(0)
  })

  it('rejects invalid input', () => {
    expect(parseCostInput('')).toBeNull()
    expect(parseCostInput('-1')).toBeNull()
    expect(parseCostInput('abc')).toBeNull()
  })

  it('detects unchanged costs', () => {
    expect(costsEqual(12.5, 12.5)).toBe(true)
    expect(costsEqual(12.50004, 12.5)).toBe(true)
    expect(costsEqual(12.501, 12.5)).toBe(false)
    expect(costsEqual(null, 12.5)).toBe(false)
  })
})
