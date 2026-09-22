import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch, apiPatchJson } from '@/lib/api'
import type {
  MatchSuggestionRuleApi,
  PatchMatchSuggestionRuleBody,
} from '@/lib/types/alert-rules'
import { invalidateAlertsQueries } from '@/pages/dashboard/use-alerts-queries'

export function matchSuggestionRuleQueryKey(tenantId: string | null) {
  return ['alert-rules', 'match_suggestion', tenantId] as const
}

export function useMatchSuggestionRuleQuery() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: matchSuggestionRuleQueryKey(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
    queryFn: async (): Promise<MatchSuggestionRuleApi> => {
      const res = await apiFetch(
        '/alerts/rules/match_suggestion',
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as MatchSuggestionRuleApi
    },
  })
}

export function usePatchMatchSuggestionRuleMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: PatchMatchSuggestionRuleBody): Promise<MatchSuggestionRuleApi> => {
      const res = await apiPatchJson(
        '/alerts/rules/match_suggestion',
        (a) => getToken(a),
        body,
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as MatchSuggestionRuleApi
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: matchSuggestionRuleQueryKey(tenantId) })
      invalidateAlertsQueries(queryClient, tenantId)
    },
  })
}
