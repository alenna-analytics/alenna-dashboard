import { useAuth } from '@clerk/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch, apiPostJson } from '@/lib/api'
import type { ShopifySyncEnqueueResponse } from '@/lib/types/connectors'
import { shellT } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { useIntegrationsListQueries } from '@/pages/integrations/hooks/use-integrations-list-queries'
import { formatShopifyLastSync } from '@/lib/integrations/shopify-format'
import { findActiveConnection } from '@/pages/integrations/dashboard/integration-connection'

export type AdsPlatformSlug = 'amazon_ads' | 'mercadolibre_ads'

export function useAdsIntegration(slug: AdsPlatformSlug) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { me } = useWorkspace()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()
  const isAdmin = can(me, 'integrations.manage')
  const { connections, pageLoading, pageError } = useIntegrationsListQueries()
  const activeConnection = findActiveConnection(connections, slug)
  const [connectStarting, setConnectStarting] = useState(false)

  const authUrl =
    slug === 'amazon_ads'
      ? '/connectors/amazon-ads/authorization-url'
      : '/connectors/mercadolibre/authorization-url?intent=ads'
  const syncPath =
    slug === 'amazon_ads' ? '/connectors/amazon-ads/sync' : '/connectors/mercadolibre-ads/sync'
  const disconnectPath = (id: string) =>
    slug === 'amazon_ads'
      ? `/connectors/amazon-ads/${id}`
      : `/connectors/mercadolibre-ads/${id}`

  const startConnect = useCallback(async () => {
    setConnectStarting(true)
    try {
      const res = await apiFetch(authUrl, (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      const body = (await res.json()) as { url: string }
      window.location.href = body.url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : shellT(lang, 'integrationConnectFailed'))
      setConnectStarting(false)
    }
  }, [authUrl, getToken, tenantId, lang])

  const disconnectMutation = useMutation({
    mutationFn: async (purgeData: boolean) => {
      if (!activeConnection) return
      const res = await apiFetch(
        `${disconnectPath(activeConnection.id)}?purge_data=${purgeData ? 'true' : 'false'}`,
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
      toast.error(e.message)
    },
  })

  const syncMutation = useMutation({
    mutationFn: async (): Promise<ShopifySyncEnqueueResponse> => {
      if (!activeConnection) {
        throw new Error(shellT(lang, 'integrationsStatusNotConnected'))
      }
      const res = await apiPostJson(
        syncPath,
        (a) => getToken(a),
        { full: true, platform_connection_id: activeConnection.id },
        {},
        tenantId,
      )
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as ShopifySyncEnqueueResponse
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      toast.success(shellT(lang, 'integrationSyncQueued'))
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })

  const siblingSlug = slug === 'amazon_ads' ? 'amazon' : 'mercadolibre'
  const sibling = findActiveConnection(connections, siblingSlug)
  const neverLabel = shellT(lang, 'integrationDetailLastSyncNever')
  const lastSyncDisplay = formatShopifyLastSync(
    activeConnection?.last_synced_at,
    lang,
    neverLabel,
  )

  return {
    isAdmin,
    connected: Boolean(activeConnection),
    activeConnection,
    sibling,
    isLoading: pageLoading,
    error: pageError,
    connectStarting,
    startConnect,
    disconnectMutation,
    syncMutation,
    syncPlan: activeConnection?.sync_plan ?? null,
    lastSyncDisplay,
    caseC: Boolean(activeConnection) && !sibling,
    caseA: Boolean(sibling) && !activeConnection,
  }
}
