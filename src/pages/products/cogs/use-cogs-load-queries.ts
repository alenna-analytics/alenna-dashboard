import { useAuth } from '@clerk/react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch, apiPatchJson, apiPostJson } from '@/lib/api'
import type {
  CogsBulkLoadAddByFilterBody,
  CogsBulkLoadApplyResponse,
  CogsBulkLoadDetailApi,
  CogsBulkLoadFilterMatchesResponse,
  CogsBulkLoadListResponse,
  CogsBulkLoadSummaryApi,
} from '@/lib/types/cogs-load'

function cogsLoadsKey(tenantId: string | null) {
  return ['catalog', 'cogs-loads', tenantId] as const
}

function cogsLoadKey(tenantId: string | null, loadId: string | undefined) {
  return ['catalog', 'cogs-load', tenantId, loadId] as const
}

export function useCogsLoadsQuery(limit = 50, offset = 0) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: [...cogsLoadsKey(tenantId), limit, offset],
    queryFn: async () => {
      const res = await apiFetch(
        `/catalog/cogs-loads?limit=${limit}&offset=${offset}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error('Failed to load COGS loads')
      return (await res.json()) as CogsBulkLoadListResponse
    },
    enabled: Boolean(tenantId),
  })
}

export function useCogsLoadQuery(loadId: string | undefined) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: cogsLoadKey(tenantId, loadId),
    queryFn: async () => {
      const res = await apiFetch(
        `/catalog/cogs-loads/${loadId}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error('Failed to load COGS load')
      return (await res.json()) as CogsBulkLoadDetailApi
    },
    enabled: Boolean(tenantId && loadId),
  })
}

function cogsLoadFilterKey(tenantId: string | null, loadId: string | undefined) {
  return ['catalog', 'cogs-load-filter', tenantId, loadId] as const
}

type CogsFilterInfiniteData = {
  pages: CogsBulkLoadFilterMatchesResponse[]
  pageParams: unknown[]
}

function isInfiniteFilterData(
  value: CogsBulkLoadFilterMatchesResponse | CogsFilterInfiniteData,
): value is CogsFilterInfiniteData {
  return 'pages' in value && Array.isArray(value.pages)
}

function patchFilterMatchesAfterAdd(
  qc: ReturnType<typeof useQueryClient>,
  tenantId: string | null,
  loadId: string,
  productIds: string[],
) {
  const removed = new Set(productIds)
  qc.setQueriesData(
    { queryKey: cogsLoadFilterKey(tenantId, loadId) },
    (
      old: CogsBulkLoadFilterMatchesResponse | CogsFilterInfiniteData | undefined,
    ): CogsBulkLoadFilterMatchesResponse | CogsFilterInfiniteData | undefined => {
      if (!old) return old
      if (isInfiniteFilterData(old)) {
        let removedCount = 0
        const pages = old.pages.map((page) => {
          const nextItems = page.items.filter((row) => !removed.has(row.product_id))
          removedCount += page.items.length - nextItems.length
          return { ...page, items: nextItems }
        })
        if (pages[0]) {
          pages[0] = {
            ...pages[0],
            total: Math.max(0, pages[0].total - removedCount),
          }
        }
        return { ...old, pages }
      }
      const nextItems = old.items.filter((row) => !removed.has(row.product_id))
      const removedCount = old.items.length - nextItems.length
      return {
        ...old,
        items: nextItems,
        total: Math.max(0, old.total - removedCount),
      }
    },
  )
}

export function useCogsLoadFilterMatchesQuery(
  loadId: string | undefined,
  params: URLSearchParams,
  enabled: boolean,
) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const qs = params.toString()

  return useQuery({
    queryKey: [...cogsLoadFilterKey(tenantId, loadId), qs],
    queryFn: async () => {
      const res = await apiFetch(
        `/catalog/cogs-loads/${loadId}/filter-matches?${qs}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error('Failed to preview filter matches')
      return (await res.json()) as CogsBulkLoadFilterMatchesResponse
    },
    enabled: Boolean(tenantId && loadId && enabled),
    placeholderData: (previous) => previous,
  })
}

export function useCogsLoadFilterMatchesInfiniteQuery(
  loadId: string | undefined,
  baseParams: URLSearchParams,
  enabled: boolean,
  pageSize: number,
) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const filterKey = baseParams.toString()

  return useInfiniteQuery({
    queryKey: [...cogsLoadFilterKey(tenantId, loadId), 'infinite', filterKey, pageSize],
    enabled: Boolean(tenantId && loadId && enabled),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams(baseParams)
      params.set('limit', String(pageSize))
      params.set('offset', String(pageParam))
      const res = await apiFetch(
        `/catalog/cogs-loads/${loadId}/filter-matches?${params.toString()}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error('Failed to preview filter matches')
      return (await res.json()) as CogsBulkLoadFilterMatchesResponse
    },
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const nextOffset = lastPageParam + pageSize
      if (nextOffset >= lastPage.total) return undefined
      return nextOffset
    },
  })
}

export function useCreateCogsLoadMutation() {
  const qc = useQueryClient()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        '/catalog/cogs-loads',
        (a) => getToken(a),
        { method: 'POST' },
        tenantId,
      )
      if (!res.ok) throw new Error('Failed to create load')
      return (await res.json()) as CogsBulkLoadSummaryApi
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cogsLoadsKey(tenantId) })
    },
  })
}

export function useDeleteCogsLoadMutation() {
  const qc = useQueryClient()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async (loadId: string) => {
      const res = await apiFetch(
        `/catalog/cogs-loads/${loadId}`,
        (a) => getToken(a),
        { method: 'DELETE' },
        tenantId,
      )
      if (!res.ok) throw new Error('Failed to delete load')
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cogsLoadsKey(tenantId) })
    },
  })
}

export function useCloneCogsLoadMutation() {
  const qc = useQueryClient()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async (loadId: string) => {
      const res = await apiFetch(
        `/catalog/cogs-loads/${loadId}/clone`,
        (a) => getToken(a),
        { method: 'POST' },
        tenantId,
      )
      if (!res.ok) throw new Error('Failed to clone load')
      return (await res.json()) as CogsBulkLoadSummaryApi
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cogsLoadsKey(tenantId) })
    },
  })
}

function parseApiErrorDetail(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback
  const detail = (body as { detail?: unknown }).detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    if (first && typeof first === 'object' && 'msg' in first) {
      return String((first as { msg: unknown }).msg)
    }
  }
  return fallback
}

export function useAddCogsLoadItemsByFilterMutation(loadId: string) {
  const qc = useQueryClient()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async (body: CogsBulkLoadAddByFilterBody) => {
      const res = await apiPostJson(
        `/catalog/cogs-loads/${loadId}/items/add-by-filter`,
        (a) => getToken(a),
        body,
        {},
        tenantId,
      )
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(parseApiErrorDetail(err, 'Failed to add items'))
      }
      return (await res.json()) as CogsBulkLoadDetailApi
    },
    onSuccess: (data) => {
      qc.setQueryData(cogsLoadKey(tenantId, loadId), data)
      void qc.invalidateQueries({ queryKey: cogsLoadsKey(tenantId) })
      void qc.invalidateQueries({ queryKey: cogsLoadFilterKey(tenantId, loadId) })
    },
  })
}

export function useAddCogsLoadItemsMutation(loadId: string) {
  const qc = useQueryClient()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const res = await apiPostJson(
        `/catalog/cogs-loads/${loadId}/items/add`,
        (a) => getToken(a),
        { product_ids: productIds },
        {},
        tenantId,
      )
      if (!res.ok) throw new Error('Failed to add products')
      return (await res.json()) as CogsBulkLoadDetailApi
    },
    onSuccess: (data, productIds) => {
      qc.setQueryData(cogsLoadKey(tenantId, loadId), data)
      void qc.invalidateQueries({ queryKey: cogsLoadsKey(tenantId) })
      patchFilterMatchesAfterAdd(qc, tenantId, loadId, productIds)
    },
  })
}

export function useRemoveCogsLoadItemMutation(loadId: string) {
  const qc = useQueryClient()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await apiFetch(
        `/catalog/cogs-loads/${loadId}/items/${productId}`,
        (a) => getToken(a),
        { method: 'DELETE' },
        tenantId,
      )
      if (!res.ok) throw new Error('Failed to remove item')
      return (await res.json()) as CogsBulkLoadDetailApi
    },
    onSuccess: (data) => {
      qc.setQueryData(cogsLoadKey(tenantId, loadId), data)
      void qc.invalidateQueries({ queryKey: cogsLoadsKey(tenantId) })
      void qc.invalidateQueries({ queryKey: cogsLoadFilterKey(tenantId, loadId) })
    },
  })
}

export function useRemoveAllCogsLoadItemsMutation(loadId: string) {
  const qc = useQueryClient()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        `/catalog/cogs-loads/${loadId}/items`,
        (a) => getToken(a),
        { method: 'DELETE' },
        tenantId,
      )
      if (!res.ok) throw new Error('Failed to remove all items')
      return (await res.json()) as CogsBulkLoadDetailApi
    },
    onSuccess: (data) => {
      qc.setQueryData(cogsLoadKey(tenantId, loadId), data)
      void qc.invalidateQueries({ queryKey: cogsLoadsKey(tenantId) })
      void qc.invalidateQueries({ queryKey: cogsLoadFilterKey(tenantId, loadId) })
    },
  })
}

export type CogsLoadItemPatchPayload = {
  productId: string
  supplier_price?: number | null
  freight_value?: number | null
  packaging_value?: number | null
  updated_at: string
}

export function usePatchCogsLoadItemMutation(loadId: string) {
  const qc = useQueryClient()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async (payload: CogsLoadItemPatchPayload) => {
      const { productId, ...body } = payload
      const res = await apiPatchJson(
        `/catalog/cogs-loads/${loadId}/items/${productId}`,
        (a) => getToken(a),
        body,
        {},
        tenantId,
      )
      if (!res.ok) throw new Error('Failed to save item')
      return (await res.json()) as CogsBulkLoadDetailApi
    },
    onSuccess: (data) => {
      qc.setQueryData(cogsLoadKey(tenantId, loadId), data)
    },
  })
}

export function usePrefillCogsLoadMutation(loadId: string) {
  const qc = useQueryClient()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        `/catalog/cogs-loads/${loadId}/prefill-from-db`,
        (a) => getToken(a),
        { method: 'POST' },
        tenantId,
      )
      if (!res.ok) throw new Error('Failed to prefill from database')
      return (await res.json()) as CogsBulkLoadDetailApi
    },
    onSuccess: (data) => {
      qc.setQueryData(cogsLoadKey(tenantId, loadId), data)
    },
  })
}

export function useApplyCogsLoadMutation(loadId: string) {
  const qc = useQueryClient()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async (body: {
      apply_mode: 'forward' | 'backfill'
      effective_from?: string
      effective_to?: string | null
    }) => {
      const res = await apiPostJson(
        `/catalog/cogs-loads/${loadId}/apply`,
        (a) => getToken(a),
        body,
        {},
        tenantId,
      )
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(parseApiErrorDetail(err, 'Apply failed'))
      }
      return (await res.json()) as CogsBulkLoadApplyResponse
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cogsLoadKey(tenantId, loadId) })
      void qc.invalidateQueries({ queryKey: cogsLoadsKey(tenantId) })
      void qc.invalidateQueries({ queryKey: ['catalog', tenantId] })
    },
  })
}
