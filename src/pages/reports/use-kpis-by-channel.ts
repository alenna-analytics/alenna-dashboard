import { useAuth } from '@clerk/react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { ChannelKpisResponse } from '@/lib/types/reports'

type Params = {
  connectionIds: string[]
  startDate: string
  endDate: string
  enabled?: boolean
}

export function useKpisByChannel({
  connectionIds,
  startDate,
  endDate,
  enabled = true,
}: Params) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  const scopeKey = connectionIds.join(',')

  return useQuery({
    staleTime: 300_000,
    queryKey: [
      'reports',
      'kpis-by-channel',
      tenantId,
      scopeKey,
      startDate,
      endDate,
    ],
    placeholderData: keepPreviousData,
    enabled: Boolean(
      enabled && tenantId && connectionIds.length > 0 && startDate && endDate,
    ),
    queryFn: async (): Promise<ChannelKpisResponse> => {
      const params = new URLSearchParams()
      for (const id of connectionIds) params.append('connection_ids', id)
      params.set('start_date', startDate)
      params.set('end_date', endDate)
      const res = await apiFetch(
        `/reports/kpis-by-channel?${params}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as ChannelKpisResponse
    },
  })
}
