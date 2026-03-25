import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type {
  AnalyticsFilters,
  DailySeriesResponse,
  ProductCatalogResponse,
  ProjectionResponse,
  SummaryResponse,
  TopProductsResponse,
} from '@/lib/analytics-types'

function buildParams(filters: AnalyticsFilters): URLSearchParams {
  const params = new URLSearchParams()
  params.set('start_date', filters.start_date)
  params.set('end_date', filters.end_date)
  if (filters.platform) {
    for (const p of filters.platform) {
      params.append('platform', p)
    }
  }
  if (filters.granularity) params.set('granularity', filters.granularity)
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.horizon_weeks) params.set('horizon_weeks', String(filters.horizon_weeks))
  if (filters.product_id) params.set('product_id', filters.product_id)
  return params
}

async function fetchJson<T>(path: string, getToken: (a?: { skipCache?: boolean }) => Promise<string | null>): Promise<T> {
  const res = await apiFetch(path, getToken)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.json() as Promise<T>
}

export function useAnalyticsSummary(filters: AnalyticsFilters) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const params = buildParams(filters)

  return useQuery<SummaryResponse>({
    queryKey: [
      'analytics',
      'summary',
      filters.start_date,
      filters.end_date,
      filters.platform,
      filters.product_id,
    ],
    queryFn: () => fetchJson(`/analytics/summary?${params}`, (a) => getToken(a)),
    enabled: !!tenantId,
    staleTime: 60_000,
  })
}

export function useAnalyticsDaily(filters: AnalyticsFilters) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const params = buildParams(filters)

  return useQuery<DailySeriesResponse>({
    queryKey: [
      'analytics',
      'daily',
      filters.start_date,
      filters.end_date,
      filters.platform,
      filters.granularity,
      filters.product_id,
    ],
    queryFn: () => fetchJson(`/analytics/daily?${params}`, (a) => getToken(a)),
    enabled: !!tenantId,
    staleTime: 60_000,
  })
}

export function useAnalyticsProducts(filters: AnalyticsFilters) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const params = buildParams(filters)

  return useQuery<TopProductsResponse>({
    queryKey: ['analytics', 'products', filters.start_date, filters.end_date, filters.platform, filters.limit],
    queryFn: () => fetchJson(`/analytics/products?${params}`, (a) => getToken(a)),
    enabled: !!tenantId,
    staleTime: 60_000,
  })
}

export function useProductCatalog(limit = 300) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const params = new URLSearchParams()
  params.set('limit', String(limit))

  return useQuery<ProductCatalogResponse>({
    queryKey: ['analytics', 'product-candidates', limit],
    queryFn: () => fetchJson(`/analytics/product-candidates?${params}`, (a) => getToken(a)),
    enabled: !!tenantId,
    staleTime: 300_000,
  })
}

export function useAnalyticsProjections(filters: AnalyticsFilters) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const params = buildParams(filters)

  return useQuery<ProjectionResponse>({
    queryKey: ['analytics', 'projections', filters.start_date, filters.end_date, filters.platform, filters.horizon_weeks],
    queryFn: () => fetchJson(`/analytics/projections?${params}`, (a) => getToken(a)),
    enabled: !!tenantId,
    staleTime: 60_000,
  })
}
