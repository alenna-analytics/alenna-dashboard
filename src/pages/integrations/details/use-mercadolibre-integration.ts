import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { apiFetch, apiPostJson } from '@/lib/api'
import { formatShopifyLastSync } from '@/lib/integrations/shopify-format'
import type { PlatformConnection } from '@/lib/types/connectors'
import { shellT } from '@/lib/i18n/shell-strings'

export type MercadoLibreIntegrationHook = ReturnType<typeof useMercadoLibreIntegration>

export function useMercadoLibreIntegration() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { me } = useWorkspace()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()
  const [oauthStarting, setOauthStarting] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const isAdmin = me?.role === 'admin' || me?.role === 'owner'

  const {
    data: connections,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
    staleTime: 10_000,
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as PlatformConnection[]
    },
  })

  const meliRows = useMemo(
    () =>
      (connections ?? []).filter(
        (c) =>
          c.platform === 'mercadolibre' &&
          c.status === 'active' &&
          c.connection_status === 'active',
      ),
    [connections],
  )

  const connected = meliRows.length > 0
  const activeConnection = meliRows[0] ?? null
  const activeConnectionId = activeConnection?.id ?? ''
  const syncPlan = activeConnection?.sync_plan ?? null
  const neverLabel = shellT(lang, 'integrationDetailLastSyncNever')
  const lastSyncDisplay = formatShopifyLastSync(
    activeConnection?.last_synced_at,
    lang,
    neverLabel,
  )

  const startOAuth = useCallback(async () => {
    setOauthStarting(true)
    try {
      const res = await apiFetch(
        '/connectors/mercadolibre/authorization-url',
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      const body = (await res.json()) as { url: string }
      window.location.href = body.url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Connection failed')
      setOauthStarting(false)
    }
  }, [getToken, tenantId])

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!activeConnectionId) return
      const res = await apiFetch(
        `/connectors/mercadolibre/${activeConnectionId}`,
        (a) => getToken(a),
        { method: 'DELETE' },
        tenantId,
      )
      if (!res.ok && res.status !== 204) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      toast.success(shellT(lang, 'integrationDisconnectDone'))
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Disconnect failed')
    },
  })

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!activeConnectionId) {
        throw new Error(shellT(lang, 'integrationsStatusNotConnected'))
      }
      const res = await apiPostJson(
        '/connectors/mercadolibre/sync',
        (a) => getToken(a),
        { platform_connection_id: activeConnectionId },
        {},
        tenantId,
      )
      if (res.status === 409) {
        throw new Error('Sync already in progress')
      }
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as { job_id: string; status: string }
    },
    onSuccess: () => {
      setSyncMessage(shellT(lang, 'integrationSyncDone'))
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })

  return {
    isAdmin,
    connected,
    activeConnectionId,
    activeConnection,
    syncPlan,
    isLoading,
    error,
    lastSyncDisplay,
    oauthStarting,
    startOAuth,
    disconnectMutation,
    syncMutation,
    syncMessage,
  }
}
