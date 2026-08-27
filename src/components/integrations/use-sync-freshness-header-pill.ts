import { formatSyncFreshnessPillLabel } from '@/lib/integrations/sync-freshness-pill-label'
import {
  resolveSyncFreshnessPillContent,
  syncFreshnessPillBadgeVariant,
  type SyncFreshnessPillContent,
} from '@/lib/integrations/sync-freshness'
import { shellT } from '@/lib/i18n/shell-strings'
import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import { useLanguage } from '@/shell/providers/language-provider'
import {
  GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { useNowMinuteTick } from '@/hooks/use-now-minute-tick'

export type SyncFreshnessPillViewModel = {
  pill: SyncFreshnessPillContent
  label: string
  variant: ReturnType<typeof syncFreshnessPillBadgeVariant>
  isSyncing: boolean
  pillTooltip: string
  onBadgeClick: () => void
}

export function useSyncFreshnessHeaderPill(): SyncFreshnessPillViewModel | null {
  const { lang } = useLanguage()
  const { restoreAllActivities, upsertActivity } = useGlobalActivity()
  const nowMs = useNowMinuteTick()
  const { data: connections } = usePlatformConnectionsQuery()

  const pill = resolveSyncFreshnessPillContent(connections ?? [], { nowMs })
  if (!pill) return null

  const isSyncing = pill.kind === 'syncing'
  const label = formatSyncFreshnessPillLabel(lang, pill)
  const variant = syncFreshnessPillBadgeVariant(pill)
  const pillTooltip = shellT(lang, 'syncFreshnessPillTooltip')

  const onBadgeClick = () => {
    if (!isSyncing) return
    upsertActivity({
      id: GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
      phase: 'loading',
      title: shellT(lang, 'shopifySyncProgressTitle'),
      subtitle: shellT(lang, 'shopifySyncProgressQueued'),
      href: '/dashboard/integrations/shopify',
      minimized: false,
    })
    restoreAllActivities()
  }

  return { pill, label, variant, isSyncing, pillTooltip, onBadgeClick }
}
