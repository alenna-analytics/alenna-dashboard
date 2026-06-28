import type { SyncFreshnessPillContent } from '@/lib/integrations/sync-freshness'
import type { SyncFreshnessPillTiming } from '@/lib/integrations/sync-freshness-age'
import { shellT } from '@/lib/i18n/shell-strings'

export function formatSyncFreshnessPillLabel(
  lang: string,
  pill: SyncFreshnessPillContent,
): string {
  if (pill.kind === 'syncing') return shellT(lang, 'syncFreshnessPillSyncing')
  if (pill.kind === 'now') return shellT(lang, 'syncFreshnessPillNow')
  if (pill.kind === 'hours_ago') {
    return shellT(
      lang,
      pill.hours === 1 ? 'syncFreshnessPillOneHourAgo' : 'syncFreshnessPillHoursAgo',
      { hours: String(pill.hours) },
    )
  }
  if (pill.kind === 'days_ago') {
    return shellT(
      lang,
      pill.days === 1 ? 'syncFreshnessPillOneDayAgo' : 'syncFreshnessPillDaysAgo',
      { days: String(pill.days) },
    )
  }
  return shellT(
    lang,
    pill.minutes === 1 ? 'syncFreshnessPillOneMinuteAgo' : 'syncFreshnessPillMinutesAgo',
    { minutes: String(pill.minutes) },
  )
}

export function formatRelativeAgeLabel(
  lang: string,
  timing: SyncFreshnessPillTiming,
): string {
  if (timing.kind === 'now') return shellT(lang, 'relativeAgeNow')
  if (timing.kind === 'hours_ago') {
    return shellT(
      lang,
      timing.hours === 1 ? 'relativeAgeOneHourAgo' : 'relativeAgeHoursAgo',
      { hours: String(timing.hours) },
    )
  }
  if (timing.kind === 'days_ago') {
    return shellT(
      lang,
      timing.days === 1 ? 'relativeAgeOneDayAgo' : 'relativeAgeDaysAgo',
      { days: String(timing.days) },
    )
  }
  return shellT(
    lang,
    timing.minutes === 1 ? 'relativeAgeOneMinuteAgo' : 'relativeAgeMinutesAgo',
    { minutes: String(timing.minutes) },
  )
}
