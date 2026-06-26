import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

export function useCogsLoadFilterMatchesQuery(
  loadId: string | undefined,
  params: URLSearchParams,
  enabled: boolean,
) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const qs = params.toString()

  return useQuery({
    queryKey: ['catalog', 'cogs-load-filter', tenantId, loadId, qs],
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
      void qc.invalidateQueries({ queryKey: ['catalog', 'cogs-load-filter', tenantId, loadId] })
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
    onSuccess: (data) => {
      qc.setQueryData(cogsLoadKey(tenantId, loadId), data)
      void qc.invalidateQueries({ queryKey: cogsLoadsKey(tenantId) })
      void qc.invalidateQueries({ queryKey: ['catalog', 'cogs-load-filter', tenantId, loadId] })
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
      void qc.invalidateQueries({ queryKey: ['catalog', 'cogs-load-filter', tenantId, loadId] })
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
      void qc.invalidateQueries({ queryKey: ['catalog', 'cogs-load-filter', tenantId, loadId] })
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
