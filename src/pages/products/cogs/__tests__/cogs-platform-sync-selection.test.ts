import { describe, expect, it } from 'vitest'

import { isDefaultSelectedRow } from '../use-cogs-platform-sync-queries'

describe('isDefaultSelectedRow', () => {
  it('selects different rows with positive platform cost', () => {
    expect(
      isDefaultSelectedRow({
        diff_status: 'different',
        platform_cost: 12.5,
        currency_mismatch: false,
      }),
    ).toBe(true)
  })

  it('skips same, currency mismatch, and missing cost', () => {
    expect(
      isDefaultSelectedRow({
        diff_status: 'same',
        platform_cost: 10,
        currency_mismatch: false,
      }),
    ).toBe(false)
    expect(
      isDefaultSelectedRow({
        diff_status: 'different',
        platform_cost: 10,
        currency_mismatch: true,
      }),
    ).toBe(false)
    expect(
      isDefaultSelectedRow({
        diff_status: 'different',
        platform_cost: null,
        currency_mismatch: false,
      }),
    ).toBe(false)
  })
})
