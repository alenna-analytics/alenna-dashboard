import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { KpiResponse } from '@/lib/types/reports'

type UseReportsParams = {
  /**
   * Single-connection mode (legacy). Use `connectionIds` instead for the
   * home page / multi-channel filter; pass `null` to disable the query.
   */
  connectionId?: string | null
  /**
   * Multi-connection mode. When non-empty, `connection_ids` is sent as
   * repeated query params and `connection_id` is omitted; the API still
   * supports the legacy single-id form for `ReportsPage`.
   */
  connectionIds?: string[]
  startDate: string
  endDate: string
  enabled?: boolean
}

export function useReports({
  connectionId,
  connectionIds,
  startDate,
  endDate,
  enabled = true,
}: UseReportsParams) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  const ids = connectionIds && connectionIds.length > 0 ? connectionIds : null
  const scopeKey = ids ? ids.join(',') : (connectionId ?? null)

  return useQuery({
    queryKey: ['reports', 'kpis', tenantId, scopeKey, startDate, endDate],
    staleTime: 300_000,
    enabled: Boolean(
      enabled &&
        tenantId &&
        startDate &&
        endDate &&
        (ids || connectionId),
    ),
    queryFn: async (): Promise<KpiResponse> => {
      const params = new URLSearchParams()
      if (ids) {
        for (const id of ids) params.append('connection_ids', id)
      } else if (connectionId) {
        params.set('connection_id', connectionId)
      }
      params.set('start_date', startDate)
      params.set('end_date', endDate)
      const res = await apiFetch(`/reports/kpis?${params}`, (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as KpiResponse
    },
  })
}
