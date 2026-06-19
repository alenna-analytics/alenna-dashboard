import { describe, expect, it } from 'vitest'

import { deriveSyncFreshnessAgeDisplay } from '@/lib/integrations/sync-freshness-age'
import { formatSyncFreshnessPillLabel } from '@/lib/integrations/sync-freshness-pill-label'

describe('deriveSyncFreshnessAgeDisplay', () => {
  it('returns now under one minute', () => {
    expect(deriveSyncFreshnessAgeDisplay(30_000)).toEqual({ kind: 'now' })
  })

  it('returns minutes from 1 to 59 minutes', () => {
    expect(deriveSyncFreshnessAgeDisplay(45 * 60_000)).toEqual({
      kind: 'minutes_ago',
      minutes: 45,
    })
  })

  it('returns whole hours from 1 to 23 hours', () => {
    expect(deriveSyncFreshnessAgeDisplay(92 * 60_000)).toEqual({
      kind: 'hours_ago',
      hours: 1,
    })
    expect(deriveSyncFreshnessAgeDisplay(2 * 60 * 60_000)).toEqual({
      kind: 'hours_ago',
      hours: 2,
    })
  })

  it('returns whole days from 24 hours onward', () => {
    expect(deriveSyncFreshnessAgeDisplay((2 * 24 * 60 + 15 * 60) * 60_000)).toEqual({
      kind: 'days_ago',
      days: 2,
    })
    expect(deriveSyncFreshnessAgeDisplay(31_441 * 60_000)).toEqual({
      kind: 'days_ago',
      days: 21,
    })
  })
})

describe('formatSyncFreshnessPillLabel', () => {
  it('formats minutes in Spanish', () => {
    expect(
      formatSyncFreshnessPillLabel('es', {
        kind: 'minutes_ago',
        minutes: 45,
        freshnessState: 'up_to_date',
      }),
    ).toBe('Última actualización: hace 45 min')
  })

  it('formats hours in Spanish', () => {
    expect(
      formatSyncFreshnessPillLabel('es', {
        kind: 'hours_ago',
        hours: 2,
        freshnessState: 'up_to_date',
      }),
    ).toBe('Última actualización: hace 2 horas')
  })

  it('formats days in English', () => {
    expect(
      formatSyncFreshnessPillLabel('en', {
        kind: 'days_ago',
        days: 21,
        freshnessState: 'outdated',
      }),
    ).toBe('Last update: 21 days ago')
  })
})
