import { describe, expect, it } from 'vitest'

import {
  computeCalendarMomPeriod,
  computeYoyPeriod,
} from '@/pages/reports/reports-ui-helpers'

describe('computeCalendarMomPeriod', () => {
  it('uses full calendar month of end date vs prior calendar month', () => {
    const out = computeCalendarMomPeriod('2026-07-16')
    expect(out).toEqual({
      current: { start: '2026-07-01', end: '2026-07-31' },
      previous: { start: '2026-06-01', end: '2026-06-30' },
    })
  })

  it('handles January → December of previous year', () => {
    const out = computeCalendarMomPeriod('2026-01-05')
    expect(out).toEqual({
      current: { start: '2026-01-01', end: '2026-01-31' },
      previous: { start: '2025-12-01', end: '2025-12-31' },
    })
  })

  it('returns null for invalid date', () => {
    expect(computeCalendarMomPeriod('not-a-date')).toBeNull()
  })
})

describe('computeYoyPeriod', () => {
  it('shifts the inclusive range back one year', () => {
    expect(computeYoyPeriod('2026-06-01', '2026-07-16')).toEqual({
      start: '2025-06-01',
      end: '2025-07-16',
    })
  })

  it('handles leap-day start when possible', () => {
    expect(computeYoyPeriod('2024-02-29', '2024-03-01')).toEqual({
      start: '2023-02-28',
      end: '2023-03-01',
    })
  })

  it('returns null when start is after end', () => {
    expect(computeYoyPeriod('2026-07-16', '2026-07-01')).toBeNull()
  })
})
