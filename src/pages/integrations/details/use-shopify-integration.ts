import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import { useCurrentTenant } from '@/auth/hooks'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { apiFetch, apiPostJson } from '@/lib/api'
import type { PlatformConnection, ShopifyOrdersPreviewResponse, ShopifySyncResponse } from '@/lib/types/connectors'
import { formatShopifyLastSync, normalizeShopifySubdomainInput, toYmd } from '@/lib/integrations/shopify-format'
import { shellT } from '@/lib/i18n/shell-strings'

export type ShopifyIntegrationHook = ReturnType<typeof useShopifyIntegration>

export function useShopifyIntegration() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { me } = useWorkspace()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()

  const isAdmin = me?.role === 'admin' || me?.role === 'owner'

  const [shopInput, setShopInput] = useState('')
  const [storePicker, setStorePicker] = useState('')
  const endD = useMemo(() => new Date(), [])
  const startD = useMemo(() => {
    const s = new Date()
    s.setDate(s.getDate() - 7)
    return s
  }, [])
  const [dateFrom, setDateFrom] = useState(() => toYmd(startD))
  const [dateTo, setDateTo] = useState(() => toYmd(endD))
  const [fullHistory, setFullHistory] = useState(false)
  const [previewMessage, setPreviewMessage] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [oauthStarting, setOauthStarting] = useState(false)

  const {
    data: connections,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as PlatformConnection[]
    },
  })

  const shopifyRows = useMemo(
    () => (connections ?? []).filter((c) => c.platform === 'shopify'),
    [connections],
  )

  const activeConnectionId = useMemo(() => {
    if (!shopifyRows.length) return ''
    if (shopifyRows.length === 1) return shopifyRows[0].id
    if (storePicker && shopifyRows.some((r) => r.id === storePicker)) return storePicker
    return shopifyRows[0].id
  }, [shopifyRows, storePicker])

  const primary = shopifyRows[0]

  const activeConnection = useMemo(
    () => shopifyRows.find((c) => c.id === activeConnectionId) ?? primary,
    [shopifyRows, activeConnectionId, primary],
  )

  const startOAuth = useCallback(async () => {
    const shop = normalizeShopifySubdomainInput(shopInput)
    if (!shop || !tenantId) return
    setPreviewMessage(null)
    setOauthStarting(true)
    try {
      const res = await apiFetch(
        `/connectors/shopify/authorization-url?shop=${encodeURIComponent(shop)}`,
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) {
        const t = await res.text()
        setPreviewMessage(t || res.statusText)
        setOauthStarting(false)
        return
      }
      const data = (await res.json()) as { url: string }
      window.location.href = data.url
    } catch (e) {
      setPreviewMessage(e instanceof Error ? e.message : String(e))
      setOauthStarting(false)
    }
  }, [getToken, shopInput, tenantId])

  const onConnectClick = useCallback(() => {
    const shop = normalizeShopifySubdomainInput(shopInput)
    if (!shop) {
      document.getElementById('shop-domain-detail')?.focus()
      return
    }
    void startOAuth()
  }, [shopInput, startOAuth])

  const previewMutation = useMutation({
    mutationFn: async (): Promise<ShopifyOrdersPreviewResponse> => {
      if (!tenantId) throw new Error('No workspace')
      const body: {
        start_date: string
        end_date: string
        platform_connection_id?: string
        full?: boolean
      } = {
        start_date: dateFrom,
        end_date: dateTo,
      }
      if (shopifyRows.length > 1 && activeConnectionId) {
        body.platform_connection_id = activeConnectionId
      }
      const res = await apiPostJson(
        '/connectors/shopify/orders-preview',
        (a) => getToken(a),
        body,
        {},
        tenantId,
      )
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as ShopifyOrdersPreviewResponse
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      const trunc = data.truncated
        ? ` ${shellT(lang, 'connectionsPreviewTruncated')}`
        : ''
      setPreviewMessage(
        `${shellT(lang, 'connectionsPreviewResult')}: ${data.orders_written}. JSONL: ${data.file_name}. CSV: ${data.csv_file_name}.${trunc}`,
      )
    },
    onError: (e: Error) => {
      setPreviewMessage(e.message)
    },
  })

  const syncMutation = useMutation({
    mutationFn: async (): Promise<ShopifySyncResponse> => {
      if (!tenantId) throw new Error('No workspace')
      const body: {
        start_date?: string
        end_date?: string
        platform_connection_id?: string
        full?: boolean
      } = {
        start_date: dateFrom,
        end_date: dateTo,
      }
      if (shopifyRows.length > 1 && activeConnectionId) {
        body.platform_connection_id = activeConnectionId
      }
      if (fullHistory) {
        body.full = true
      }
      const res = await apiPostJson(
        '/connectors/shopify/sync',
        (a) => getToken(a),
        body,
        {},
        tenantId,
      )
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as ShopifySyncResponse
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      setSyncMessage(
        `${shellT(lang, 'integrationSyncDone')}: ${data.records_synced}`,
      )
    },
    onError: (e: Error) => {
      setSyncMessage(e.message)
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId || !activeConnectionId) throw new Error('No connection')
      const res = await apiFetch(
        `/connectors/shopify/${activeConnectionId}`,
        (a) => getToken(a),
        { method: 'DELETE' },
        tenantId,
      )
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      setSyncMessage(shellT(lang, 'integrationDisconnectDone'))
    },
    onError: (e: Error) => {
      setSyncMessage(e.message)
    },
  })

  const connected = shopifyRows.length > 0
  const neverLabel = shellT(lang, 'integrationDetailLastSyncNever')
  const lastSyncDisplay = formatShopifyLastSync(activeConnection?.last_synced_at, lang, neverLabel)

  return {
    lang,
    tenantId,
    isAdmin,
    shopInput,
    setShopInput,
    storePicker,
    setStorePicker,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    fullHistory,
    setFullHistory,
    previewMessage,
    setPreviewMessage,
    syncMessage,
    setSyncMessage,
    isLoading,
    error,
    shopifyRows,
    activeConnectionId,
    primary,
    activeConnection,
    connected,
    oauthStarting,
    startOAuth,
    onConnectClick,
    previewMutation,
    syncMutation,
    disconnectMutation,
    neverLabel,
    lastSyncDisplay,
  }
}
