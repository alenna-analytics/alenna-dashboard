import { useAuth } from '@clerk/react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { TopProductsResponse } from '@/lib/types/reports'

type Params = {
  connectionIds: string[]
  productIds?: string[]
  startDate: string
  endDate: string
  limit?: number
  enabled?: boolean
}

export function useTopProducts({
  connectionIds,
  productIds,
  startDate,
  endDate,
  limit = 10,
  enabled = true,
}: Params) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  const scopeKey = connectionIds.join(',')

  return useQuery({
    staleTime: 300_000,
    queryKey: [
      'reports',
      'top-products',
      tenantId,
      scopeKey,
      productIds?.join(',') ?? null,
      startDate,
      endDate,
      limit,
    ],
    placeholderData: keepPreviousData,
    enabled: Boolean(
      enabled && tenantId && connectionIds.length > 0 && startDate && endDate,
    ),
    queryFn: async (): Promise<TopProductsResponse> => {
      const params = new URLSearchParams()
      for (const id of connectionIds) params.append('connection_ids', id)
      for (const id of productIds ?? []) params.append('product_ids', id)
      params.set('start_date', startDate)
      params.set('end_date', endDate)
      params.set('limit', String(limit))
      const res = await apiFetch(
        `/reports/top-products?${params}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as TopProductsResponse
    },
  })
}
