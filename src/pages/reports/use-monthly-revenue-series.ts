import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { MonthlyRevenueSeriesResponse } from '@/lib/types/reports'

type Params = {
  connectionId: string | null
  startDate: string
  endDate: string
  enabled?: boolean
}

export function useMonthlyRevenueSeries({
  connectionId,
  startDate,
  endDate,
  enabled = true,
}: Params) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: ['reports', 'monthly-revenue', tenantId, connectionId, startDate, endDate],
    enabled: Boolean(enabled && tenantId && connectionId && startDate && endDate),
    queryFn: async (): Promise<MonthlyRevenueSeriesResponse> => {
      const params = new URLSearchParams({
        connection_id: connectionId!,
        start_date: startDate,
        end_date: endDate,
      })
      const res = await apiFetch(`/reports/monthly-revenue?${params}`, (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as MonthlyRevenueSeriesResponse
    },
  })
}
