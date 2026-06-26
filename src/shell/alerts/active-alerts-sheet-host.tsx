import { useCallback, useMemo } from 'react'
import { useAuth } from '@clerk/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
import type { PlatformConnection } from '@/lib/types/connectors'
import {
  invalidateAlertsQueries,
  useAlertsListQuery,
  usePostponeAlertMutation,
} from '@/pages/dashboard/use-alerts-queries'
import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import { useLanguage } from '@/shell/providers/language-provider'

import { ActiveAlertsSheet } from './active-alerts-sheet'
import { useAlertsSheet } from './alerts-sheet-context'
import { useAlertsSyncInvalidation } from './use-alerts-sync-invalidation'

export function ActiveAlertsSheetHost() {
  const { lang } = useLanguage()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()
  const { open, setOpen } = useAlertsSheet()
  const { me } = useAppBootstrap()
  const isAdmin = me?.role === 'admin' || me?.role === 'owner'

  useAlertsSyncInvalidation()

  const connectionsQuery = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
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

  const activeAlertsQuery = useAlertsListQuery('active', open)
  const postponedAlertsQuery = useAlertsListQuery('postponed', open)
  const postponeAlertMutation = usePostponeAlertMutation()

  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      invalidateAlertsQueries(queryClient, tenantId)
    }
    setOpen(nextOpen)
  }

  return (
    <ActiveAlertsSheet
      open={open}
      onOpenChange={handleOpenChange}
      activeItems={activeAlertsQuery.data?.items ?? []}
      postponedItems={postponedAlertsQuery.data?.items ?? []}
      activeLoading={activeAlertsQuery.isLoading}
      postponedLoading={postponedAlertsQuery.isLoading}
      isAdmin={isAdmin}
      postponePending={postponeAlertMutation.isPending}
      connectionPlatformById={connectionPlatformById}
      onPostpone={(alertId, duration) => {
        postponeAlertMutation.mutate({ alertId, duration })
      }}
      t={t}
    />
  )
}
