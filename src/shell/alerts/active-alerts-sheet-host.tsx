import { useCallback, useMemo } from 'react'
import { useAuth } from '@clerk/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import type { PlatformConnection } from '@/lib/types/connectors'
import {
  invalidateAlertsQueries,
  useAlertsListQuery,
  useAlertsSummaryQuery,
  usePostponeAlertMutation,
} from '@/pages/dashboard/use-alerts-queries'
import {
  useAcceptProductLinkSuggestionMutation,
  useRejectProductLinkSuggestionMutation,
} from '@/pages/products/vinculacion/use-product-link-queries'
import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import { useLanguage } from '@/shell/providers/language-provider'

import { ActiveAlertsSheet } from './active-alerts-sheet'
import { useAlertsSheet } from './alerts-sheet-context'

export function ActiveAlertsSheetHost() {
  const { lang } = useLanguage()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()
  const { open, setOpen, pendingKind, clearPendingKind } = useAlertsSheet()
  const { me } = useAppBootstrap()
  const canViewAlerts = can(me, 'alerts.view')
  const isAdmin = can(me, 'alerts.manage')
  const canLinkProducts = can(me, 'products.groups.edit')
  const summaryQuery = useAlertsSummaryQuery()
  const acceptMatch = useAcceptProductLinkSuggestionMutation()
  const rejectMatch = useRejectProductLinkSuggestionMutation()

  const connectionsQuery = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId) && canViewAlerts,
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as PlatformConnection[]
    },
  })

  const connectionPlatformById = useMemo(() => {
    const map = new Map<string, string>()
    for (const connection of connectionsQuery.data ?? []) {
      map.set(connection.id, connection.platform)
    }
    return map
  }, [connectionsQuery.data])

  const activeAlertsQuery = useAlertsListQuery('active', open && canViewAlerts)
  const postponedAlertsQuery = useAlertsListQuery('postponed', open && canViewAlerts)
  const postponeAlertMutation = usePostponeAlertMutation()

  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      invalidateAlertsQueries(queryClient, tenantId)
    } else {
      clearPendingKind()
    }
    setOpen(nextOpen)
  }

  return (
    <ActiveAlertsSheet
      open={open}
      onOpenChange={handleOpenChange}
      activeItems={activeAlertsQuery.data?.items ?? []}
      postponedItems={postponedAlertsQuery.data?.items ?? []}
      activeTotal={
        summaryQuery.data?.total_active ??
        activeAlertsQuery.data?.total ??
        activeAlertsQuery.data?.items.length ??
        0
      }
      postponedTotal={
        summaryQuery.data?.postponed_count ??
        postponedAlertsQuery.data?.total ??
        postponedAlertsQuery.data?.items.length ??
        0
      }
      activeLoading={activeAlertsQuery.isLoading}
      postponedLoading={postponedAlertsQuery.isLoading}
      isAdmin={isAdmin}
      canLinkProducts={canLinkProducts}
      postponePending={postponeAlertMutation.isPending}
      linkPending={acceptMatch.isPending}
      rejectPending={rejectMatch.isPending}
      connectionPlatformById={connectionPlatformById}
      initialKind={pendingKind}
      onInitialKindConsumed={clearPendingKind}
      onPostpone={(alertId, duration) => {
        postponeAlertMutation.mutate({ alertId, duration })
      }}
      onAcceptMatch={(suggestionId) => {
        void acceptMatch
          .mutateAsync(suggestionId)
          .then(() => toast.success(t('homeAlertsSheetLinkSuccess')))
          .catch(() => toast.error(t('homeAlertsSheetLinkFailed')))
      }}
      onRejectMatch={(suggestionId) => {
        void rejectMatch
          .mutateAsync(suggestionId)
          .then(() => toast.success(t('homeAlertsSheetRejectSuccess')))
          .catch(() => toast.error(t('homeAlertsSheetLinkFailed')))
      }}
      t={t}
    />
  )
}
