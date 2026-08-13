import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch, apiPutJson } from '@/lib/api'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { shellT } from '@/lib/i18n/shell-strings'
import { resolvePnlLabel } from '@/lib/pnl/resolve-pnl-label'
import type { PnlLabelOverridesResponse, PutPnlLabelOverridesBody } from '@/lib/types/pnl-labels'
import type { PnlRowId } from '@/pages/reports/reports-pnl-rows'
import { useLanguage } from '@/shell/providers/language-provider'

export function pnlLabelsQueryKey(tenantId: string | null) {
  return ['settings', 'pnl-labels', tenantId] as const
}

export function usePnlLabelsQuery() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useQuery({
    queryKey: pnlLabelsQueryKey(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 60_000,
    queryFn: async (): Promise<PnlLabelOverridesResponse> => {
      const res = await apiFetch('/settings/pnl-labels', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as PnlLabelOverridesResponse
    },
  })
}

export function usePutPnlLabelsMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: PutPnlLabelOverridesBody): Promise<PnlLabelOverridesResponse> => {
      const res = await apiPutJson('/settings/pnl-labels', (a) => getToken(a), body, {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as PnlLabelOverridesResponse
    },
    onSuccess: (data) => {
      if (tenantId) {
        queryClient.setQueryData(pnlLabelsQueryKey(tenantId), data)
      }
    },
  })
}

export function usePnlLabelResolver(): (rowId: PnlRowId) => string {
  const { lang } = useLanguage()
  const { data } = usePnlLabelsQuery()
  const locale = lang === 'en' ? 'en' : 'es'

  return useCallback(
    (rowId: PnlRowId) =>
      resolvePnlLabel(rowId, locale, (key: ShellStringKey) => shellT(lang, key), data?.overrides),
    [data?.overrides, lang, locale],
  )
}
