import { useState } from 'react'

import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { Info, Loader2 } from 'lucide-react'

import { useCurrentTenant } from '@/auth/hooks'
import { formatSyncFreshnessPillLabel } from '@/lib/integrations/sync-freshness-pill-label'
import { apiFetch } from '@/lib/api'
import {
  connectorsQueryRefetchIntervalMs,
  resolveSyncFreshnessPillContent,
  syncFreshnessPillBadgeVariant,
} from '@/lib/integrations/sync-freshness'
import { shellT } from '@/lib/i18n/shell-strings'
import type { PlatformConnection } from '@/lib/types/connectors'
import { useLanguage } from '@/shell/providers/language-provider'
import {
  GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { Badge } from '@/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'
import { cn } from '@/lib/utils'
import { useShopifySyncBanner } from '@/components/integrations/use-shopify-sync-banner'
import { useNowMinuteTick } from '@/hooks/use-now-minute-tick'

export function SyncFreshnessHeaderPill() {
  const { lang } = useLanguage()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const [pillTooltipOpen, setPillTooltipOpen] = useState(false)
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

  const pill = resolveSyncFreshnessPillContent(connections ?? [], { nowMs })
  const isSyncing = pill?.kind === 'syncing'

  if (!pill) return null

  const label = formatSyncFreshnessPillLabel(lang, pill)
  const variant = syncFreshnessPillBadgeVariant(pill)
  const pillTooltip = shellT(lang, 'syncFreshnessPillTooltip')
  const infoTooltip = shellT(lang, 'syncFreshnessPillInfoTooltip')

  const onBadgeClick = () => {
    if (isSyncing) {
      upsertActivity({
        id: GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
        phase: 'loading',
        title: shellT(lang, 'shopifySyncProgressTitle'),
        subtitle: shellT(lang, 'shopifySyncProgressQueued'),
        href: '/dashboard/integrations',
        minimized: false,
      })
      restoreAllActivities()
      setPillTooltipOpen(false)
      return
    }
    setPillTooltipOpen((open) => !open)
  }

  return (
    <div className="flex max-w-[min(100vw-8rem,18rem)] shrink-0 items-center gap-1">
      <Tooltip open={pillTooltipOpen} onOpenChange={setPillTooltipOpen}>
        <TooltipTrigger asChild>
          <Badge
            variant={variant}
            className={cn(
              'h-7 min-w-0 max-w-full shrink cursor-pointer gap-1.5 truncate px-2.5 py-0 text-xs font-medium transition-opacity hover:opacity-90',
            )}
            render={
              <button
                type="button"
                className="inline-flex max-w-full min-w-0 items-center gap-1.5"
                aria-label={pillTooltip}
                onClick={onBadgeClick}
              />
            }
          >
            {pill.kind === 'syncing' ? (
              <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden />
            ) : null}
            <span className="truncate">{label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6} className="max-w-56 text-center">
          {pillTooltip}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
            aria-label={infoTooltip}
          >
            <Info className="size-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6} className="max-w-56 text-center">
          {infoTooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
