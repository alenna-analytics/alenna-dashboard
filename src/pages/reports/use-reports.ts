import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { KpiResponse } from '@/lib/types/reports'

type UseReportsParams = {
  connectionId: string | null
  startDate: string
  endDate: string
}

export function useReports({ connectionId, startDate, endDate }: UseReportsParams) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: ['reports', 'kpis', tenantId, connectionId, startDate, endDate],
    enabled: Boolean(tenantId && connectionId && startDate && endDate),
    queryFn: async (): Promise<KpiResponse> => {
      const params = new URLSearchParams({
        connection_id: connectionId!,
        start_date: startDate,
        end_date: endDate,
      })
      const res = await apiFetch(`/reports/kpis?${params}`, (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as KpiResponse
    },
  })
}
