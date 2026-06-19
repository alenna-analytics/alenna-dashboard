import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch, apiPostJson } from '@/lib/api'
import type {
  AlertPostponeDuration,
  AlertSection,
  AlertItemApi,
  AlertsListApi,
  AlertsSummaryApi,
} from '@/lib/types/alerts'

export function alertsSummaryQueryKey(tenantId: string | null) {
  return ['alerts', 'summary', tenantId] as const
}

export function alertsListQueryKey(
  tenantId: string | null,
  section: AlertSection,
) {
  return ['alerts', 'list', tenantId, section] as const
}

export function useAlertsSummaryQuery() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: alertsSummaryQueryKey(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 60_000,
    queryFn: async (): Promise<AlertsSummaryApi> => {
      const res = await apiFetch('/alerts/summary', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as AlertsSummaryApi
    },
  })
}

export function useAlertsListQuery(section: AlertSection, enabled: boolean) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: alertsListQueryKey(tenantId, section),
    enabled: Boolean(tenantId) && enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<AlertsListApi> => {
      const params = new URLSearchParams({ section, limit: '50', offset: '0' })
      const res = await apiFetch(
        `/alerts?${params.toString()}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as AlertsListApi
    },
  })
}

export function usePostponeAlertMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      alertId,
      duration,
    }: {
      alertId: string
      duration: AlertPostponeDuration
    }): Promise<AlertItemApi> => {
      const res = await apiPostJson(
        `/alerts/${alertId}/postpone`,
        (a) => getToken(a),
        { duration },
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as AlertItemApi
    },
    onSuccess: async () => {
      if (!tenantId) return
      await queryClient.invalidateQueries({ queryKey: alertsSummaryQueryKey(tenantId) })
      await queryClient.invalidateQueries({ queryKey: ['alerts', 'list', tenantId] })
    },
  })
}

export function invalidateAlertsQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: string | null,
) {
  if (!tenantId) return
  void queryClient.invalidateQueries({ queryKey: alertsSummaryQueryKey(tenantId) })
  void queryClient.invalidateQueries({ queryKey: ['alerts', 'list', tenantId] })
}
