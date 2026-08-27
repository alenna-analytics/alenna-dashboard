export type SyncFreshnessPillTiming =
  | { kind: 'now' }
  | { kind: 'minutes_ago'; minutes: number }
  | { kind: 'hours_ago'; hours: number }
  | { kind: 'days_ago'; days: number }

/** Cadence promised in product: incremental sync at least every 6 hours. */
export const CONNECTION_SYNC_PROMISE_MS = 6 * 60 * 60 * 1000

/** Last successful sync older than a week is critically stale. */
export const CONNECTION_SYNC_CRITICAL_MS = 7 * 24 * 60 * 60 * 1000

export type ConnectionSyncAgeTone = 'on_time' | 'past_promise' | 'critical'

export type ConnectionSyncAgePillVariant = 'success' | 'warning' | 'error'

export function deriveConnectionSyncAgeTone(ageMs: number): ConnectionSyncAgeTone {
  if (ageMs >= CONNECTION_SYNC_CRITICAL_MS) return 'critical'
  if (ageMs >= CONNECTION_SYNC_PROMISE_MS) return 'past_promise'
  return 'on_time'
}

export function connectionSyncAgePillVariant(ageMs: number): ConnectionSyncAgePillVariant {
  const tone = deriveConnectionSyncAgeTone(ageMs)
  if (tone === 'critical') return 'error'
  if (tone === 'past_promise') return 'warning'
  return 'success'
}

/** Maps elapsed ms to whole-minute, whole-hour, or whole-day tiers. */
export function deriveSyncFreshnessAgeDisplay(ageMs: number): SyncFreshnessPillTiming {
  const totalMinutes = Math.floor(Math.max(0, ageMs) / 60_000)
  if (totalMinutes < 1) {
    return { kind: 'now' }
  }
  if (totalMinutes < 60) {
    return { kind: 'minutes_ago', minutes: totalMinutes }
  }
  if (totalMinutes < 24 * 60) {
    return { kind: 'hours_ago', hours: Math.floor(totalMinutes / 60) }
  }
  return { kind: 'days_ago', days: Math.floor(totalMinutes / (24 * 60)) }
}
