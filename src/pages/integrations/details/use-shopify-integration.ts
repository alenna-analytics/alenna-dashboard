import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { apiFetch, apiPostJson } from '@/lib/api'
import type {
  PlatformConnection,
  ShopifyOrdersPreviewResponse,
  ShopifySyncEnqueueResponse,
} from '@/lib/types/connectors'
import { formatShopifyLastSync, normalizeShopifySubdomainInput, toYmd } from '@/lib/integrations/shopify-format'
import { shellT } from '@/lib/i18n/shell-strings'
import {
  GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { useCatalogJobQuery, useRetryCatalogJobMutation } from '@/pages/products/use-catalog-queries'

export type ShopifyIntegrationHook = ReturnType<typeof useShopifyIntegration>

type ShopifySyncFiltersState = {
  dateFrom: string
  dateTo: string
  storePicker: string
  fullHistory: boolean
}

function parseShopifySyncFilters(raw: unknown): ShopifySyncFiltersState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.dateFrom !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.dateFrom)) return null
  if (typeof o.dateTo !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.dateTo)) return null
  if (typeof o.storePicker !== 'string') return null
  if (typeof o.fullHistory !== 'boolean') return null
  return {
    dateFrom: o.dateFrom,
    dateTo: o.dateTo,
    storePicker: o.storePicker,
    fullHistory: o.fullHistory,
  }
}

type ShopifySyncBlockSuccess = {
  connectionId: string
  recordsSynced: number
  catalogProductsUpserted: number
  minOrderDate: string | null
  maxOrderDate: string | null
}

export type ShopifySyncPanelState = {
  pendingJobId: string | null
  pendingConnectionId: string | null
  failedJobId: string | null
  failedConnectionId: string | null
  failedMessage: string | null
  blockSuccess: ShopifySyncBlockSuccess | null
}

const DEFAULT_SHOPIFY_SYNC_PANEL: ShopifySyncPanelState = {
  pendingJobId: null,
  pendingConnectionId: null,
  failedJobId: null,
  failedConnectionId: null,
  failedMessage: null,
  blockSuccess: null,
}

function parseShopifySyncPanel(raw: unknown): ShopifySyncPanelState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  let blockSuccess: ShopifySyncBlockSuccess | null = null
  if (o.blockSuccess && typeof o.blockSuccess === 'object') {
    const b = o.blockSuccess as Record<string, unknown>
    if (typeof b.connectionId === 'string' && typeof b.recordsSynced === 'number') {
      blockSuccess = {
        connectionId: b.connectionId,
        recordsSynced: b.recordsSynced,
        catalogProductsUpserted:
          typeof b.catalogProductsUpserted === 'number' ? b.catalogProductsUpserted : 0,
        minOrderDate: typeof b.minOrderDate === 'string' ? b.minOrderDate : null,
        maxOrderDate: typeof b.maxOrderDate === 'string' ? b.maxOrderDate : null,
      }
    }
  }

  return {
    pendingJobId: typeof o.pendingJobId === 'string' ? o.pendingJobId : null,
    pendingConnectionId: typeof o.pendingConnectionId === 'string' ? o.pendingConnectionId : null,
    failedJobId: typeof o.failedJobId === 'string' ? o.failedJobId : null,
    failedConnectionId: typeof o.failedConnectionId === 'string' ? o.failedConnectionId : null,
    failedMessage: typeof o.failedMessage === 'string' ? o.failedMessage : null,
    blockSuccess,
  }
}

export function useShopifyIntegration() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { me } = useWorkspace()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()
  const { upsertActivity, patchActivity, removeActivity } = useGlobalActivity()

  const isAdmin = me?.role === 'admin' || me?.role === 'owner'

  const [shopInput, setShopInput] = useState('')

  const defaultSyncFilters = useMemo((): ShopifySyncFiltersState => {
    const endD = new Date()
    const startD = new Date()
    startD.setDate(startD.getDate() - 7)
    return {
      dateFrom: toYmd(startD),
      dateTo: toYmd(endD),
      storePicker: '',
      fullHistory: false,
    }
  }, [])

  const [syncFilters, setSyncFilters] = useTenantPersistedJson(
    tenantId,
    'alenna.shopify.sync.filters',
    defaultSyncFilters,
    parseShopifySyncFilters,
  )
  const { dateFrom, dateTo, storePicker, fullHistory } = syncFilters

  const [syncPanel, setSyncPanel] = useTenantPersistedJson(
    tenantId,
    'alenna.shopify.sync.panel',
    DEFAULT_SHOPIFY_SYNC_PANEL,
    parseShopifySyncPanel,
  )

  const setDateFrom = useCallback(
    (v: string) => {
      setSyncFilters({ dateFrom: v })
    },
    [setSyncFilters],
  )
  const setDateTo = useCallback(
    (v: string) => {
      setSyncFilters({ dateTo: v })
    },
    [setSyncFilters],
  )
  const setStorePicker = useCallback(
    (v: string) => {
      setSyncFilters({ storePicker: v })
    },
    [setSyncFilters],
  )
  const setFullHistory = useCallback(
    (v: boolean) => {
      setSyncFilters({ fullHistory: v })
    },
    [setSyncFilters],
  )
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

  const pollShopifyJob = Boolean(
    syncPanel.pendingJobId &&
      syncPanel.pendingConnectionId &&
      syncPanel.pendingConnectionId === activeConnectionId,
  )

  const shopifyJobQuery = useCatalogJobQuery(syncPanel.pendingJobId, pollShopifyJob)

  const retryCatalogJobMutation = useRetryCatalogJobMutation()

  const toastStatusRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pollShopifyJob || !syncPanel.pendingJobId) {
      toastStatusRef.current = null
      return
    }
    const job = shopifyJobQuery.data
    if (!job || job.id !== syncPanel.pendingJobId) return

    if (job.status === 'queued' || job.status === 'running') {
      toastStatusRef.current = job.status
      return
    }

    const prev = toastStatusRef.current
    if (prev === null) {
      toastStatusRef.current = job.status
      if (job.status === 'succeeded') toast.success(shellT(lang, 'shopifySyncToastSuccess'))
      if (job.status === 'failed') toast.error(shellT(lang, 'shopifySyncToastFailed'))
      return
    }
    if (prev === job.status) return
    toastStatusRef.current = job.status
    if (job.status === 'succeeded') toast.success(shellT(lang, 'shopifySyncToastSuccess'))
    if (job.status === 'failed') toast.error(shellT(lang, 'shopifySyncToastFailed'))
  }, [pollShopifyJob, syncPanel.pendingJobId, shopifyJobQuery.data, lang])

  useEffect(() => {
    if (!pollShopifyJob || !syncPanel.pendingJobId) return
    const job = shopifyJobQuery.data
    if (!job || job.id !== syncPanel.pendingJobId) return
    if (job.status !== 'queued' && job.status !== 'running') return

    let subtitle =
      job.status === 'queued'
        ? shellT(lang, 'shopifySyncProgressQueued')
        : shellT(lang, 'syncRunning')
    if (job.status === 'running') {
      const prog = job.progress ?? {}
      const raw = prog.orders_processed
      const op =
        typeof raw === 'number'
          ? raw
          : typeof raw === 'string'
            ? Number.parseInt(raw, 10)
            : null
      const pgRaw = prog.page
      const pg =
        typeof pgRaw === 'number'
          ? pgRaw
          : typeof pgRaw === 'string'
            ? Number.parseInt(pgRaw, 10)
            : null
      if (op != null && !Number.isNaN(op)) {
        subtitle = `${shellT(lang, 'shopifySyncProgressOrders')}: ${op.toLocaleString()}`
        if (pg != null && !Number.isNaN(pg)) {
          subtitle += ` · ${shellT(lang, 'shopifySyncProgressPages')} ${pg}`
        }
      }
    }
    patchActivity(GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID, { phase: 'loading', subtitle })
  }, [
    pollShopifyJob,
    syncPanel.pendingJobId,
    shopifyJobQuery.data,
    lang,
    patchActivity,
  ])

  const settledJobSigRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pollShopifyJob || !syncPanel.pendingJobId) return
    const job = shopifyJobQuery.data
    if (!job || job.id !== syncPanel.pendingJobId) return

    if (job.status === 'queued' || job.status === 'running') {
      settledJobSigRef.current = null
      return
    }

    const sig = `${job.id}:${job.status}:${job.finished_at ?? ''}`
    if (settledJobSigRef.current === sig) return
    settledJobSigRef.current = sig

    const pendingConn = syncPanel.pendingConnectionId

    if (job.status === 'succeeded' && pendingConn) {
      const summaryParts: string[] = [
        `${job.records_synced ?? 0} ${shellT(lang, 'reportsOrders')}`,
      ]
      const cat = job.catalog_products_upserted ?? 0
      if (cat > 0) {
        summaryParts.push(`${cat} ${shellT(lang, 'syncProductsUpdated')}`)
      }
      patchActivity(GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID, {
        phase: 'success',
        subtitle: summaryParts.join(' · '),
      })
      setSyncPanel({
        pendingJobId: null,
        pendingConnectionId: null,
        failedJobId: null,
        failedConnectionId: null,
        failedMessage: null,
        blockSuccess: {
          connectionId: pendingConn,
          recordsSynced: job.records_synced ?? 0,
          catalogProductsUpserted: job.catalog_products_upserted ?? 0,
          minOrderDate: job.min_order_date ?? null,
          maxOrderDate: job.max_order_date ?? null,
        },
      })
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      return
    }

    if (job.status === 'failed' && pendingConn) {
      patchActivity(GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID, {
        phase: 'error',
        subtitle: job.error_message ?? shellT(lang, 'syncErrorLabel'),
      })
      setSyncPanel({
        pendingJobId: null,
        pendingConnectionId: null,
        failedJobId: job.id,
        failedConnectionId: pendingConn,
        failedMessage: job.error_message ?? shellT(lang, 'syncErrorLabel'),
        blockSuccess: null,
      })
    }
  }, [
    pollShopifyJob,
    syncPanel.pendingJobId,
    syncPanel.pendingConnectionId,
    shopifyJobQuery.data,
    setSyncPanel,
    queryClient,
    tenantId,
    lang,
    patchActivity,
  ])

  const shopifySyncPhase = useMemo((): 'idle' | 'working' | 'done_ok' | 'done_fail' => {
    if (!activeConnectionId) return 'idle'
    if (syncPanel.pendingJobId && syncPanel.pendingConnectionId === activeConnectionId) {
      return 'working'
    }
    if (syncPanel.blockSuccess?.connectionId === activeConnectionId) {
      return 'done_ok'
    }
    if (
      syncPanel.failedJobId &&
      syncPanel.failedConnectionId === activeConnectionId
    ) {
      return 'done_fail'
    }
    return 'idle'
  }, [
    activeConnectionId,
    syncPanel.pendingJobId,
    syncPanel.pendingConnectionId,
    syncPanel.blockSuccess,
    syncPanel.failedJobId,
    syncPanel.failedConnectionId,
  ])

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
    mutationFn: async (): Promise<ShopifySyncEnqueueResponse> => {
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
      return (await res.json()) as ShopifySyncEnqueueResponse
    },
    onSuccess: (data) => {
      upsertActivity({
        id: GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
        phase: 'loading',
        title: shellT(lang, 'shopifySyncProgressTitle'),
        subtitle: shellT(lang, 'shopifySyncProgressQueued'),
        href: '/dashboard/integrations',
        minimized: false,
      })
      setSyncPanel({
        pendingJobId: data.job_id,
        pendingConnectionId: activeConnectionId,
        failedJobId: null,
        failedConnectionId: null,
        failedMessage: null,
        blockSuccess: null,
      })
    },
    onError: (e: Error) => {
      setSyncMessage(e.message)
      upsertActivity({
        id: GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
        phase: 'error',
        title: shellT(lang, 'shopifySyncProgressTitle'),
        subtitle: e.message,
        href: '/dashboard/integrations',
        minimized: false,
      })
    },
  })

  const retryShopifySync = useCallback(() => {
    const fid = syncPanel.failedJobId
    const fc = syncPanel.failedConnectionId
    if (!fid || !fc) return
    retryCatalogJobMutation.mutate(fid, {
      onSuccess: () => {
        upsertActivity({
          id: GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
          phase: 'loading',
          title: shellT(lang, 'shopifySyncProgressTitle'),
          subtitle: shellT(lang, 'shopifySyncProgressQueued'),
          href: '/dashboard/integrations',
          minimized: false,
        })
        setSyncPanel({
          pendingJobId: fid,
          pendingConnectionId: fc,
          failedJobId: null,
          failedConnectionId: null,
          failedMessage: null,
          blockSuccess: null,
        })
      },
    })
  }, [
    retryCatalogJobMutation,
    syncPanel.failedJobId,
    syncPanel.failedConnectionId,
    setSyncPanel,
    upsertActivity,
    lang,
  ])

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
      setSyncPanel({ ...DEFAULT_SHOPIFY_SYNC_PANEL })
      removeActivity(GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID)
      setSyncMessage(shellT(lang, 'integrationDisconnectDone'))
    },
    onError: (e: Error) => {
      setSyncMessage(e.message)
    },
  })

  const connected = shopifyRows.length > 0
  const neverLabel = shellT(lang, 'integrationDetailLastSyncNever')
  const lastSyncDisplay = formatShopifyLastSync(activeConnection?.last_synced_at, lang, neverLabel)

  const shopifyJobProgress = shopifyJobQuery.data?.progress ?? null
  const ordersProcessedRaw = shopifyJobProgress?.orders_processed
  const ordersProcessed =
    typeof ordersProcessedRaw === 'number'
      ? ordersProcessedRaw
      : typeof ordersProcessedRaw === 'string'
        ? Number.parseInt(ordersProcessedRaw, 10)
        : null
  const pageRaw = shopifyJobProgress?.page
  const syncPage =
    typeof pageRaw === 'number' ? pageRaw : typeof pageRaw === 'string' ? Number.parseInt(pageRaw, 10) : null

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
    shopifySyncPhase,
    shopifyJobQuery,
    ordersProcessed,
    syncPage,
    syncPanelBlockSuccess: syncPanel.blockSuccess,
    syncFailedMessage: syncPanel.failedMessage,
    retryShopifySync,
    retryShopifySyncPending: retryCatalogJobMutation.isPending,
  }
}
