import { describe, expect, it } from 'vitest'

import {
  CONNECTION_SYNC_CRITICAL_MS,
  CONNECTION_SYNC_PROMISE_MS,
  connectionSyncAgePillVariant,
  deriveConnectionSyncAgeTone,
  deriveSyncFreshnessAgeDisplay,
} from '@/lib/integrations/sync-freshness-age'
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
        ageMs: 45 * 60 * 1000,
      }),
    ).toBe('Última actualización: hace 45 min')
  })

  it('formats hours in Spanish', () => {
    expect(
      formatSyncFreshnessPillLabel('es', {
        kind: 'hours_ago',
        hours: 2,
        freshnessState: 'up_to_date',
        ageMs: 2 * 60 * 60 * 1000,
      }),
    ).toBe('Última actualización: hace 2 horas')
  })

  it('formats days in English', () => {
    expect(
      formatSyncFreshnessPillLabel('en', {
        kind: 'days_ago',
        days: 21,
        freshnessState: 'outdated',
        ageMs: 21 * 24 * 60 * 60 * 1000,
      }),
    ).toBe('Last update: 21 days ago')
  })
})

describe('deriveConnectionSyncAgeTone', () => {
  it('stays on time until the 6 hour promise elapses', () => {
    expect(deriveConnectionSyncAgeTone(60 * 60 * 1000)).toBe('on_time')
    expect(deriveConnectionSyncAgeTone(CONNECTION_SYNC_PROMISE_MS - 1)).toBe('on_time')
  })

  it('turns past promise at 6 hours and stays there through 5 days', () => {
    expect(deriveConnectionSyncAgeTone(CONNECTION_SYNC_PROMISE_MS)).toBe('past_promise')
    expect(deriveConnectionSyncAgeTone(5 * 24 * 60 * 60 * 1000)).toBe('past_promise')
    expect(deriveConnectionSyncAgeTone(CONNECTION_SYNC_CRITICAL_MS - 1)).toBe('past_promise')
  })

  it('turns critical after one week', () => {
    expect(deriveConnectionSyncAgeTone(CONNECTION_SYNC_CRITICAL_MS)).toBe('critical')
    expect(deriveConnectionSyncAgeTone(8 * 24 * 60 * 60 * 1000)).toBe('critical')
  })
})

describe('connectionSyncAgePillVariant', () => {
  it('maps tones to success, warning, and error', () => {
    expect(connectionSyncAgePillVariant(60 * 60 * 1000)).toBe('success')
    expect(connectionSyncAgePillVariant(CONNECTION_SYNC_PROMISE_MS)).toBe('warning')
    expect(connectionSyncAgePillVariant(CONNECTION_SYNC_CRITICAL_MS)).toBe('error')
  })
})
