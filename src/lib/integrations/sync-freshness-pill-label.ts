import type { SyncFreshnessPillContent } from '@/lib/integrations/sync-freshness'
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
