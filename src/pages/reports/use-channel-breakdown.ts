import { useAuth } from '@clerk/react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { ChannelBreakdownResponse } from '@/lib/types/reports'

type Params = {
  connectionIds: string[]
  productIds?: string[]
  startDate: string
  endDate: string
  enabled?: boolean
}

export function useChannelBreakdown({
  connectionIds,
  productIds,
  startDate,
  endDate,
  enabled = true,
}: Params) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  const scopeKey = connectionIds.join(',')

  return useQuery({
    queryKey: [
      'reports',
      'channel-breakdown',
      tenantId,
      scopeKey,
      productIds?.join(',') ?? null,
      startDate,
      endDate,
    ],
    placeholderData: keepPreviousData,
    enabled: Boolean(
      enabled && tenantId && connectionIds.length > 0 && startDate && endDate,
    ),
    queryFn: async (): Promise<ChannelBreakdownResponse> => {
      const params = new URLSearchParams()
      for (const id of connectionIds) params.append('connection_ids', id)
      for (const id of productIds ?? []) params.append('product_ids', id)
      params.set('start_date', startDate)
      params.set('end_date', endDate)
      const res = await apiFetch(
        `/reports/channel-breakdown?${params}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as ChannelBreakdownResponse
    },
  })
}
