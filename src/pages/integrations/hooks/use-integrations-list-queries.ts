import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { IntegrationPlatformRow, PlatformConnection } from '@/lib/types/connectors'
import {
  mergeIntegrationPlatform,
  type ManagedIntegration,
} from '@/lib/integrations/catalog'
import { connectorsQueryRefetchIntervalMs } from '@/lib/integrations/sync-freshness'

export type IntegrationsListState = {
  integrations: ManagedIntegration[]
  connections: PlatformConnection[]
  pageLoading: boolean
  pageError: unknown
  isFetching: boolean
  dataUpdatedAt: number
  refetch: () => void
}

export function useIntegrationsListQueries(): IntegrationsListState {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  const platformsQuery = useQuery({
    queryKey: ['integration-platforms', tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<IntegrationPlatformRow[]> => {
      const res = await apiFetch(
        '/connectors/integration-platforms',
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as IntegrationPlatformRow[]
    },
  })

  const connectorsQuery = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
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

  const integrations = useMemo((): ManagedIntegration[] => {
    const rows = platformsQuery.data ?? []
    return rows.map(mergeIntegrationPlatform)
  }, [platformsQuery.data])

  const connections = useMemo(
    () => connectorsQuery.data ?? [],
    [connectorsQuery.data],
  )

  const pageLoading = platformsQuery.isLoading || connectorsQuery.isLoading
  const pageError = platformsQuery.error ?? connectorsQuery.error
  const isFetching = platformsQuery.isFetching || connectorsQuery.isFetching
  const dataUpdatedAt = Math.max(platformsQuery.dataUpdatedAt, connectorsQuery.dataUpdatedAt)

  const refetch = () => {
    void platformsQuery.refetch()
    void connectorsQuery.refetch()
  }

  return {
    integrations,
    connections,
    pageLoading,
    pageError,
    isFetching,
    dataUpdatedAt,
    refetch,
  }
}
