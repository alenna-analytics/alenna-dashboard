import { useAuth } from '@clerk/react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type {
  MonthlyRevenueSeriesResponse,
  RevenueSeriesGranularity,
} from '@/lib/types/reports'

type Params = {
  connectionId?: string | null
  connectionIds?: string[]
  startDate: string
  endDate: string
  granularity?: RevenueSeriesGranularity
  enabled?: boolean
}

export function useMonthlyRevenueSeries({
  connectionId,
  connectionIds,
  startDate,
  endDate,
  granularity = 'month',
  enabled = true,
}: Params) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  const ids = connectionIds && connectionIds.length > 0 ? connectionIds : null
  const scopeKey = ids ? ids.join(',') : (connectionId ?? null)

  return useQuery({
    queryKey: ['reports', 'monthly-revenue', tenantId, scopeKey, startDate, endDate, granularity],
    placeholderData: keepPreviousData,
    enabled: Boolean(
      enabled && tenantId && startDate && endDate && (ids || connectionId),
    ),
    queryFn: async (): Promise<MonthlyRevenueSeriesResponse> => {
      const params = new URLSearchParams()
      if (ids) {
        for (const id of ids) params.append('connection_ids', id)
      } else if (connectionId) {
        params.set('connection_id', connectionId)
      }
      params.set('start_date', startDate)
      params.set('end_date', endDate)
      params.set('granularity', granularity)
      const res = await apiFetch(`/reports/monthly-revenue?${params}`, (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as MonthlyRevenueSeriesResponse
    },
  })
}
