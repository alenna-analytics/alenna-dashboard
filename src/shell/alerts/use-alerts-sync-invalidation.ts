import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { PlatformConnection } from '@/lib/types/connectors'
import { invalidateAlertsQueries } from '@/pages/dashboard/use-alerts-queries'

export function useAlertsSyncInvalidation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()

  const connectionsQuery = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as PlatformConnection[]
    },
  })

  const syncingNow =
    connectionsQuery.data?.some((c) => c.sync_plan?.last_sync_status === 'syncing') ?? false
  const wasSyncingRef = useRef(false)

  useEffect(() => {
    if (wasSyncingRef.current && !syncingNow) {
      invalidateAlertsQueries(queryClient, tenantId)
    }
    wasSyncingRef.current = syncingNow
  }, [syncingNow, tenantId, queryClient])
}
