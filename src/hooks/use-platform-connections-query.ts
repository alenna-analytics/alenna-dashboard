import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { connectorsQueryRefetchIntervalMs } from '@/lib/integrations/sync-freshness'
import type { PlatformConnection } from '@/lib/types/connectors'

export function usePlatformConnectionsQuery() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
    refetchInterval: (query) => connectorsQueryRefetchIntervalMs(query.state.data),
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as PlatformConnection[]
    },
  })
}
