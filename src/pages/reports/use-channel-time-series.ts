import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { ChannelTimeSeriesResponse, RevenueSeriesGranularity } from '@/lib/types/reports'

type Params = {
  connectionIds?: string[]
  productIds?: string[]
  startDate: string
  endDate: string
  granularity: RevenueSeriesGranularity
  enabled?: boolean
}

export function useChannelTimeSeries({
  connectionIds,
  productIds,
  startDate,
  endDate,
  granularity,
  enabled = true,
}: Params) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  const ids = connectionIds && connectionIds.length > 0 ? connectionIds : null
  const scopeKey = ids ? ids.join(',') : null
  const productKey = productIds?.length ? productIds.slice().sort().join(',') : ''

  return useQuery({
    queryKey: [
      'reports',
      'channel-time-series',
      tenantId,
      scopeKey,
      productKey,
      startDate,
      endDate,
      granularity,
    ],
    enabled: Boolean(enabled && tenantId && startDate && endDate && ids),
    queryFn: async (): Promise<ChannelTimeSeriesResponse> => {
      const params = new URLSearchParams()
      if (ids) {
        for (const id of ids) params.append('connection_ids', id)
      }
      params.set('start_date', startDate)
      params.set('end_date', endDate)
      params.set('granularity', granularity)
      if (productIds && productIds.length > 0) {
        for (const pid of productIds) params.append('product_ids', pid)
      }
      const res = await apiFetch(
        `/reports/channel-time-series?${params}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ChannelTimeSeriesResponse
    },
  })
}
