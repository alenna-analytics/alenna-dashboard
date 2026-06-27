import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { PlatformConnection } from '@/lib/types/connectors'
import { invalidateAlertsQueries } from '@/pages/dashboard/use-alerts-queries'

function hasActiveSyncJob(connections: PlatformConnection[] | undefined): boolean {
  return (
    connections?.some(
      (c) =>
        Boolean(c.sync_plan?.current_job_id) ||
        c.sync_plan?.last_sync_status === 'syncing',
    ) ?? false
  )
}

function hasFreshlyCompletedSync(
  prev: PlatformConnection[] | undefined,
  next: PlatformConnection[] | undefined,
): boolean {
  if (!prev?.length || !next?.length) return false
  const prevById = new Map(prev.map((c) => [c.id, c]))
  for (const conn of next) {
    const before = prevById.get(conn.id)
    if (!before) continue
    const prevStatus = before.sync_plan?.last_sync_status
    const nextStatus = conn.sync_plan?.last_sync_status
    if (
      nextStatus &&
      (nextStatus === 'synced' || nextStatus === 'partial') &&
      prevStatus !== nextStatus
    ) {
      return true
    }
    const prevJob = before.sync_plan?.current_job_id
    const nextJob = conn.sync_plan?.current_job_id
    if (prevJob && !nextJob && nextStatus !== 'failed') {
      return true
    }
    const prevCompleted = before.sync_plan?.last_sync_completed_at
    const nextCompleted = conn.sync_plan?.last_sync_completed_at
    if (nextCompleted && nextCompleted !== prevCompleted) {
      return true
    }
  }
  return false
}

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

  const connections = connectionsQuery.data
  const syncingNow = hasActiveSyncJob(connections)
  const wasSyncingRef = useRef(false)
  const prevConnectionsRef = useRef<PlatformConnection[] | undefined>(undefined)

  useEffect(() => {
    const prevConnections = prevConnectionsRef.current

    if (wasSyncingRef.current && !syncingNow) {
      invalidateAlertsQueries(queryClient, tenantId)
    } else if (hasFreshlyCompletedSync(prevConnections, connections)) {
      invalidateAlertsQueries(queryClient, tenantId)
    }

    wasSyncingRef.current = syncingNow
    prevConnectionsRef.current = connections
  }, [connections, syncingNow, tenantId, queryClient])
}
