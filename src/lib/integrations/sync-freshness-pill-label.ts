import type { SyncFreshnessPillContent } from '@/lib/integrations/sync-freshness'
import { shellT } from '@/lib/i18n/shell-strings'

export function formatSyncFreshnessPillLabel(
  lang: string,
  pill: SyncFreshnessPillContent,
): string {
  if (pill.kind === 'syncing') return shellT(lang, 'syncFreshnessPillSyncing')
  if (pill.kind === 'now') return shellT(lang, 'syncFreshnessPillNow')
  return shellT(lang, 'syncFreshnessPillMinutesAgo', {
    minutes: String(pill.minutes ?? 0),
  })
}
