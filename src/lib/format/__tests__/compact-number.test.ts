import { describe, expect, it } from 'vitest'
import { formatCompactNumber } from '../compact-number'

describe('formatCompactNumber', () => {
  it('uses K for thousands and M for millions', () => {
    expect(formatCompactNumber(5000, 0)).toBe('5K')
    expect(formatCompactNumber(18056.12, 2)).toBe('18.06K')
    expect(formatCompactNumber(1_500_000, 1)).toBe('1.5M')
  })
})
