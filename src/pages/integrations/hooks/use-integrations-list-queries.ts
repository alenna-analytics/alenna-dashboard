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

export function useIntegrationsListQueries(): {
  integrations: ManagedIntegration[]
  pageLoading: boolean
  pageError: unknown
} {
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

  const pageLoading = platformsQuery.isLoading || connectorsQuery.isLoading
  const pageError = platformsQuery.error ?? connectorsQuery.error

  return {
    integrations,
    pageLoading,
    pageError,
  }
}
