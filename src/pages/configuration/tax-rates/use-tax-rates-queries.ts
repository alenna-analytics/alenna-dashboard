import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import { apiFetch, apiPutJson } from '@/lib/api'
import { canReadTaxRates } from '@/lib/permissions/can'
import type { PutTaxSettingsBody, TaxSettingsResponse } from '@/lib/types/tax-settings'

export function taxRatesQueryKey(tenantId: string | null) {
  return ['settings', 'tax-rates', tenantId] as const
}

export function useTaxRatesQuery() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { me } = useAppBootstrap()
  const canRead = canReadTaxRates(me)

  return useQuery({
    queryKey: taxRatesQueryKey(tenantId),
    enabled: Boolean(tenantId) && canRead,
    staleTime: 60_000,
    queryFn: async (): Promise<TaxSettingsResponse> => {
      const res = await apiFetch('/settings/tax-rates', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as TaxSettingsResponse
    },
  })
}

export function usePutTaxRatesMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: PutTaxSettingsBody): Promise<TaxSettingsResponse> => {
      const res = await apiPutJson('/settings/tax-rates', (a) => getToken(a), body, {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as TaxSettingsResponse
    },
    onSuccess: (data) => {
      if (tenantId) {
        queryClient.setQueryData(taxRatesQueryKey(tenantId), data)
      }
    },
  })
}
