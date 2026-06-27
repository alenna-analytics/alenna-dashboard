import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { formatSyncFreshnessPillLabel } from '@/lib/integrations/sync-freshness-pill-label'
import { apiFetch } from '@/lib/api'
import {
  connectorsQueryRefetchIntervalMs,
  resolveSyncFreshnessPillContent,
  syncFreshnessPillBadgeVariant,
  type SyncFreshnessPillContent,
} from '@/lib/integrations/sync-freshness'
import { shellT } from '@/lib/i18n/shell-strings'
import type { PlatformConnection } from '@/lib/types/connectors'
import { useLanguage } from '@/shell/providers/language-provider'
import {
  GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { useShopifySyncBanner } from '@/components/integrations/use-shopify-sync-banner'
import { useMercadoLibreSyncBanner } from '@/components/integrations/use-mercadolibre-sync-banner'
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
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { restoreAllActivities, upsertActivity } = useGlobalActivity()
  const nowMs = useNowMinuteTick()

  const { data: connections } = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      connectorsQueryRefetchIntervalMs(query.state.data),
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as PlatformConnection[]
    },
  })

  useShopifySyncBanner(connections)
  useMercadoLibreSyncBanner(connections)

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
      href: '/dashboard/integrations/shopify?tab=settings',
      minimized: false,
    })
    restoreAllActivities()
  }

  return { pill, label, variant, isSyncing, pillTooltip, onBadgeClick }
}
