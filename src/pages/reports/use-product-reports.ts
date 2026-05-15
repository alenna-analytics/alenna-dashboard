import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { ProductKpiResponse } from '@/lib/types/reports'

type Params = {
  connectionIds: string[]
  productIds: string[]
  startDate: string
  endDate: string
  enabled?: boolean
}

/**
 * Product-scoped KPI subset for the home page when a product is selected.
 * Omits order-level fields (taxes, shipping, fees, EBITDA) on purpose --
 * see backend `get_product_kpi_report` doc for the rationale.
 */
export function useProductReports({
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
      'kpis-by-product',
      tenantId,
      scopeKey,
      productIds.join(','),
      startDate,
      endDate,
    ],
    enabled: Boolean(
      enabled &&
        tenantId &&
        productIds.length > 0 &&
        connectionIds.length > 0 &&
        startDate &&
        endDate,
    ),
    queryFn: async (): Promise<ProductKpiResponse> => {
      const params = new URLSearchParams()
      for (const id of connectionIds) params.append('connection_ids', id)
      for (const id of productIds) params.append('product_ids', id)
      params.set('start_date', startDate)
      params.set('end_date', endDate)
      const res = await apiFetch(
        `/reports/kpis-by-product?${params}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as ProductKpiResponse
    },
  })
}
