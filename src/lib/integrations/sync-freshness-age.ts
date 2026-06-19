export type SyncFreshnessPillTiming =
  | { kind: 'now' }
  | { kind: 'minutes_ago'; minutes: number }
  | { kind: 'hours_ago'; hours: number }
  | { kind: 'days_ago'; days: number }

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
