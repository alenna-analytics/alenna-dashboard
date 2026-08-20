import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'

export type RequestedAccessItem = {
  key: string
  label: string
}

export function useRequestedAccess(slug: string, enabled: boolean) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  return useQuery({
    queryKey: ['connector-requested-access', tenantId, slug],
    enabled: enabled && Boolean(tenantId),
    queryFn: async (): Promise<RequestedAccessItem[]> => {
      const res = await apiFetch(
        `/connectors/${slug}/requested-access`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      const body = (await res.json()) as { items: RequestedAccessItem[] }
      return body.items
    },
  })
}
