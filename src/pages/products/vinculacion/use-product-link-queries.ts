import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch, apiPatchJson, apiPostJson, type GetTokenFn } from '@/lib/api'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type {
  ProductLinkCandidatesPageApi,
  ProductLinkGroupApi,
  ProductLinkSuggestionsPageApi,
} from '@/lib/types/product-links'
import { invalidateAlertsQueries } from '@/pages/dashboard/use-alerts-queries'
import { useCatalogJobQuery } from '@/pages/products/use-catalog-queries'

export function productLinkSuggestionsQueryKey(tenantId: string | null) {
  return ['catalog', 'product-link-suggestions', tenantId] as const
}

export function productLinkGroupQueryKey(
  tenantId: string | null,
  groupId: string,
  periodStart: string,
  periodEnd: string,
) {
  return ['catalog', 'product-link-group', tenantId, groupId, periodStart, periodEnd] as const
}

export function useProductLinkSuggestionsQuery() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: productLinkSuggestionsQueryKey(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<ProductLinkSuggestionsPageApi> => {
      const res = await apiFetch(
        '/catalog/product-link-suggestions?status=pending&limit=50&offset=0',
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ProductLinkSuggestionsPageApi
    },
  })
}

export function useProductLinkCandidatesQuery(
  q: string,
  platforms: string[],
  enabled: boolean,
) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const platformKey = [...platforms]
    .map((platform) => platform.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(',')

  return useQuery({
    queryKey: ['catalog', 'product-link-candidates', tenantId, q, platformKey],
    enabled: Boolean(tenantId && enabled),
    queryFn: async (): Promise<ProductLinkCandidatesPageApi> => {
      const sp = new URLSearchParams({ limit: '50', offset: '0' })
      if (q.trim()) sp.set('q', q.trim())
      for (const platform of platforms) {
        const slug = platform.trim().toLowerCase()
        if (slug) sp.append('platform', slug)
      }
      const res = await apiFetch(
        `/catalog/product-link-candidates?${sp.toString()}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ProductLinkCandidatesPageApi
    },
  })
}

export function useProductLinkGroupQuery(
  groupId: string | undefined,
  periodStart: string,
  periodEnd: string,
) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: productLinkGroupQueryKey(tenantId, groupId ?? '', periodStart, periodEnd),
    enabled: Boolean(tenantId && groupId),
    queryFn: async (): Promise<ProductLinkGroupApi> => {
      const sp = new URLSearchParams({ period_start: periodStart, period_end: periodEnd })
      const res = await apiFetch(
        `/catalog/product-link-groups/${groupId}?${sp.toString()}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ProductLinkGroupApi
    },
  })
}

export function useProductLinkRefreshMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async (source: 'enter' | 'button') => {
      const res = await apiPostJson(
        '/catalog/product-link-refresh',
        (a) => getToken(a),
        { source },
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as { job_id: string; status: string }
    },
  })
}

export function useAcceptProductLinkSuggestionMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const res = await apiPostJson(
        `/catalog/product-link-suggestions/${suggestionId}/accept`,
        (a) => getToken(a),
        {},
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ProductLinkGroupApi
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['catalog', tenantId] })
      invalidateAlertsQueries(qc, tenantId)
    },
  })
}

export function useRejectProductLinkSuggestionMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const res = await apiPostJson(
        `/catalog/product-link-suggestions/${suggestionId}/reject`,
        (a) => getToken(a),
        {},
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productLinkSuggestionsQueryKey(tenantId) })
      invalidateAlertsQueries(qc, tenantId)
    },
  })
}

export function useCreateProductLinkGroupMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const res = await apiPostJson(
        '/catalog/product-link-groups',
        (a) => getToken(a),
        { product_ids: productIds },
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ProductLinkGroupApi
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['catalog', tenantId] })
      invalidateAlertsQueries(qc, tenantId)
    },
  })
}

export function usePatchProductLinkGroupMutation(groupId: string) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (title: string) => {
      const res = await apiPatchJson(
        `/catalog/product-link-groups/${groupId}`,
        (a) => getToken(a),
        { title },
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ProductLinkGroupApi
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['catalog', 'product-link-group', tenantId, groupId] })
    },
  })
}

export async function deleteProductLinkGroup(
  getToken: GetTokenFn,
  tenantId: string | null,
  groupId: string,
): Promise<void> {
  const res = await apiFetch(
    `/catalog/product-link-groups/${groupId}`,
    (a) => getToken(a),
    { method: 'DELETE' },
    tenantId,
  )
  if (!res.ok) throw new Error(await res.text())
}

export async function deleteProductLinkMember(
  getToken: GetTokenFn,
  tenantId: string | null,
  groupId: string,
  productId: string,
): Promise<void> {
  const res = await apiFetch(
    `/catalog/product-link-groups/${groupId}/members/${productId}`,
    (a) => getToken(a),
    { method: 'DELETE' },
    tenantId,
  )
  if (!res.ok) throw new Error(await res.text())
}

export function useProductLinkRefreshOnEnter(
  stale: boolean | undefined,
  currentJobId: string | null | undefined,
  t: (key: ShellStringKey) => string,
) {
  const refresh = useProductLinkRefreshMutation()
  const qc = useQueryClient()
  const { tenantId } = useCurrentTenant()
  const started = useRef(false)
  const enqueue = refresh.mutateAsync
  const jobId = refresh.data?.job_id ?? currentJobId ?? null
  const jobQuery = useCatalogJobQuery(jobId, Boolean(jobId))

  useEffect(() => {
    if (started.current) return
    if (stale !== true) return
    if (currentJobId) return
    started.current = true
    void enqueue('enter').catch(() => {
      started.current = false
    })
  }, [stale, currentJobId, enqueue])

  useEffect(() => {
    if (jobQuery.data?.status !== 'succeeded') return
    void qc.invalidateQueries({ queryKey: productLinkSuggestionsQueryKey(tenantId) })
    invalidateAlertsQueries(qc, tenantId)
  }, [jobQuery.data?.status, qc, tenantId])

  useEffect(() => {
    if (jobQuery.data?.status !== 'failed') return
    toast.error(t('productsVinculacionSearchFailed'))
  }, [jobQuery.data?.status, t])

  const searching =
    jobQuery.data?.status === 'queued' ||
    jobQuery.data?.status === 'running' ||
    refresh.isPending

  return { searching, refresh }
}
