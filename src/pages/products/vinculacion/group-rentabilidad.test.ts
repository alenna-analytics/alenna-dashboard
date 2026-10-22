import { describe, expect, it } from 'vitest'

import { ivaDivisor, unitCostsDiffer } from './group-rentabilidad'

describe('ivaDivisor', () => {
  it('keeps amounts unchanged when IVA is included', () => {
    expect(ivaDivisor(true, 16)).toBe(1)
    expect(ivaDivisor(true, null)).toBe(1)
  })

  it('strips the configured transferred IVA rate', () => {
    expect(ivaDivisor(false, 16)).toBeCloseTo(1 / 1.16)
    expect(ivaDivisor(false, 8)).toBeCloseTo(1 / 1.08)
  })

  it('uses 16% when the tenant has not saved a rate', () => {
    expect(ivaDivisor(false, null)).toBeCloseTo(1 / 1.16)
    expect(ivaDivisor(false, undefined)).toBeCloseTo(1 / 1.16)
  })
})

describe('unitCostsDiffer', () => {
  it('treats a single known cost as equal across channels', () => {
    expect(unitCostsDiffer([190, null])).toBe(false)
    expect(unitCostsDiffer([])).toBe(false)
  })

  it('flags costs that are not the same', () => {
    expect(unitCostsDiffer([190, 190, 210])).toBe(true)
    expect(unitCostsDiffer([190, 190.004])).toBe(false)
  })
})
