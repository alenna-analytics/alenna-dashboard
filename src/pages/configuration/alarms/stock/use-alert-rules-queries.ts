import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch, apiPatchJson, apiPostJson } from '@/lib/api'
import type {
  CreateStockOverrideBody,
  PatchStockOverrideBody,
  PatchStockRuleBody,
  StockOverrideApi,
  StockOverrideListApi,
  StockRuleApi,
} from '@/lib/types/alert-rules'
import { invalidateAlertsQueries } from '@/pages/dashboard/use-alerts-queries'

export function stockRuleQueryKey(tenantId: string | null) {
  return ['alert-rules', 'stock', tenantId] as const
}

export function stockOverridesQueryKey(tenantId: string | null) {
  return ['alert-rules', 'overrides', tenantId] as const
}

export function useStockRuleQuery() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: stockRuleQueryKey(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
    queryFn: async (): Promise<StockRuleApi> => {
      const res = await apiFetch('/alerts/rules/stock', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as StockRuleApi
    },
  })
}

export function useStockOverridesQuery() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: stockOverridesQueryKey(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
    queryFn: async (): Promise<StockOverrideListApi> => {
      const params = new URLSearchParams({ alert_type: 'stock' })
      const res = await apiFetch(
        `/alerts/overrides?${params.toString()}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as StockOverrideListApi
    },
  })
}

function invalidateAlertConfigQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: string | null,
) {
  if (!tenantId) return
  void queryClient.invalidateQueries({ queryKey: stockRuleQueryKey(tenantId) })
  void queryClient.invalidateQueries({ queryKey: stockOverridesQueryKey(tenantId) })
  invalidateAlertsQueries(queryClient, tenantId)
  void queryClient.invalidateQueries({ queryKey: ['catalog'] })
}

export function usePatchStockRuleMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: PatchStockRuleBody): Promise<StockRuleApi> => {
      const res = await apiPatchJson('/alerts/rules/stock', (a) => getToken(a), body, {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as StockRuleApi
    },
    onSuccess: async () => {
      invalidateAlertConfigQueries(queryClient, tenantId)
    },
  })
}

export function useCreateStockOverrideMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: CreateStockOverrideBody): Promise<StockOverrideApi> => {
      const res = await apiPostJson('/alerts/overrides', (a) => getToken(a), body, {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as StockOverrideApi
    },
    onSuccess: async () => {
      invalidateAlertConfigQueries(queryClient, tenantId)
    },
  })
}

export function usePatchStockOverrideMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      overrideId,
      body,
    }: {
      overrideId: string
      body: PatchStockOverrideBody
    }): Promise<StockOverrideApi> => {
      const res = await apiPatchJson(
        `/alerts/overrides/${overrideId}`,
        (a) => getToken(a),
        body,
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as StockOverrideApi
    },
    onSuccess: async () => {
      invalidateAlertConfigQueries(queryClient, tenantId)
    },
  })
}

export function useDeleteStockOverrideMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (overrideId: string): Promise<void> => {
      const res = await apiFetch(
        `/alerts/overrides/${overrideId}`,
        (a) => getToken(a),
        { method: 'DELETE' },
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
    },
    onSuccess: async () => {
      invalidateAlertConfigQueries(queryClient, tenantId)
    },
  })
}
