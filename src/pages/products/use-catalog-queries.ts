import { useAuth } from '@clerk/react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch, apiPatchJson, apiPostJson } from '@/lib/api'
import type {
  CatalogJobApi,
  ProductDetailApi,
  ProductListResponse,
  ProductStockAlertCountsApi,
  StockAlertLevel,
} from '@/lib/types/catalog'

export type ProductListQueryParams = {
  q: string
  limit: number
  offset: number
  sortBy: string
  sortDir: 'asc' | 'desc'
  statuses: string[]
  platforms: string[]
  stockAlertLevels: StockAlertLevel[]
}

export function useProductStockAlertCountsQuery() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: ['catalog', 'stock-alert-counts', tenantId],
    enabled: Boolean(tenantId),
    staleTime: 60_000,
    queryFn: async (): Promise<ProductStockAlertCountsApi> => {
      const res = await apiFetch(
        '/catalog/products/stock-alert-counts',
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ProductStockAlertCountsApi
    },
  })
}

export function useProductListQuery(params: ProductListQueryParams) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { q, limit, offset, sortBy, sortDir, statuses, platforms, stockAlertLevels } = params

  return useQuery({
    queryKey: [
      'catalog',
      'products',
      tenantId,
      q,
      limit,
      offset,
      sortBy,
      sortDir,
      statuses,
      platforms,
      stockAlertLevels,
    ],
    enabled: Boolean(tenantId),
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ProductListResponse> => {
      const sp = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        sort_by: sortBy,
        sort_dir: sortDir,
      })
      if (q.trim()) sp.set('q', q.trim())
      for (const st of statuses) {
        if (st === 'active' || st === 'inactive') sp.append('status', st)
      }
      for (const plat of platforms) {
        if (plat.trim()) sp.append('platform', plat.trim().toLowerCase())
      }
      for (const level of stockAlertLevels) {
        sp.append('stock_alert', level)
      }
      const res = await apiFetch(
        `/catalog/products?${sp.toString()}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ProductListResponse
    },
  })
}

export type ProductDetailMetricsParams = {
  metricsStart: string
  metricsEnd: string
}

export function useProductDetailQuery(
  productId: string | undefined,
  metrics?: ProductDetailMetricsParams,
) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const metricsStart = metrics?.metricsStart
  const metricsEnd = metrics?.metricsEnd

  return useQuery({
    queryKey: ['catalog', 'product', tenantId, productId, metricsStart, metricsEnd],
    enabled: Boolean(tenantId && productId),
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ProductDetailApi> => {
      const sp = new URLSearchParams()
      if (metricsStart) sp.set('metrics_start', metricsStart)
      if (metricsEnd) sp.set('metrics_end', metricsEnd)
      const qs = sp.toString()
      const res = await apiFetch(
        `/catalog/products/${productId}${qs ? `?${qs}` : ''}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ProductDetailApi
    },
  })
}

export function usePatchProductCostMutation(productId: string | undefined) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (body: {
      cost?: number
      currency?: string | null
      internal_sku?: string | null
    }) => {
      if (!productId) throw new Error('Missing product')
      const payload: Record<string, unknown> = {}
      if (body.cost !== undefined) payload.cost = body.cost
      if (body.currency !== undefined) payload.currency = body.currency
      if ('internal_sku' in body) payload.internal_sku = body.internal_sku
      const res = await apiPatchJson(
        `/catalog/products/${productId}`,
        (a) => getToken(a),
        payload,
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ProductDetailApi
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['catalog', 'product', tenantId, productId] })
      void qc.invalidateQueries({ queryKey: ['catalog', 'products', tenantId] })
      void qc.invalidateQueries({ queryKey: ['catalog', 'stock-alert-counts', tenantId] })
    },
  })
}

export function useEnqueueCogsBackfillMutation(productId: string | undefined) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (body: {
      cost: number
      currency?: string | null
      effective_from: string
      effective_to: string | null
    }) => {
      if (!productId) throw new Error('Missing product')
      const res = await apiPostJson(
        `/catalog/products/${productId}/cogs-backfill`,
        (a) => getToken(a),
        body,
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as { job_id: string; status: string }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['catalog', 'product', tenantId, productId] })
      void qc.invalidateQueries({ queryKey: ['catalog', 'products', tenantId] })
    },
  })
}

export function useEnqueueListingPriceHistoryBackfillMutation(
  productId: string | undefined,
) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await apiPostJson(
        `/catalog/listing-price-history/backfill`,
        (a) => getToken(a),
        {},
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as { job_id: string; status: string }
    },
    onSuccess: () => {
      if (productId) {
        void qc.invalidateQueries({
          queryKey: ['catalog', 'product', tenantId, productId],
        })
      }
      void qc.invalidateQueries({ queryKey: ['catalog', 'products', tenantId] })
    },
  })
}

export function useCatalogJobQuery(jobId: string | null, enabled: boolean) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: ['catalog', 'job', tenantId, jobId],
    enabled: Boolean(tenantId && jobId && enabled),
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === 'queued' || s === 'running' ? 2000 : false
    },
    queryFn: async (): Promise<CatalogJobApi> => {
      const res = await apiFetch(
        `/catalog/jobs/${jobId}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as CatalogJobApi
    },
  })
}

export function useRetryCatalogJobMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiPostJson(
        `/catalog/jobs/${jobId}/retry`,
        (a) => getToken(a),
        {},
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as { job_id: string; status: string }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['catalog', 'job', tenantId] })
    },
  })
}
