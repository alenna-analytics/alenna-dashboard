import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { apiFetch, apiPostJson } from '@/lib/api'
import {
  ShopifySyncCooldownError,
  ShopifySyncFailedRetryCapError,
  ShopifySyncInProgressError,
  ShopifySyncTenantBusyError,
  type PlatformConnection,
  type ShopifySyncEnqueueResponse,
  type ShopifySyncTypedError,
  type SyncPlan,
} from '@/lib/types/connectors'
import { formatShopifyLastSync, normalizeShopifySubdomainInput } from '@/lib/integrations/shopify-format'
import { shellT } from '@/lib/i18n/shell-strings'
import {
  GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { useCatalogJobQuery, useRetryCatalogJobMutation } from '@/pages/products/use-catalog-queries'
import { extractShopifyJobProgressInfo } from '@/lib/integrations/shopify-job-progress'

export type ShopifyIntegrationHook = ReturnType<typeof useShopifyIntegration>

type ShopifySyncFiltersState = {
  storePicker: string
}

function parseShopifySyncFilters(raw: unknown): ShopifySyncFiltersState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.storePicker !== 'string') return null
  return { storePicker: o.storePicker }
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

function readRetryAfterSeconds(res: Response): number | null {
  const raw = res.headers.get('Retry-After')
  if (!raw) return null
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

async function readApiErrorDetail(res: Response): Promise<string | null> {
  const text = await res.text()
  if (!text) return null
  try {
    const parsed = JSON.parse(text) as unknown
    if (parsed && typeof parsed === 'object' && 'detail' in parsed) {
      const detail = (parsed as { detail: unknown }).detail
      if (typeof detail === 'string') return detail
    }
  } catch {
    /* not json */
  }
  return text
}

function buildSyncTypedError(
  status: number,
  detail: string | null,
  retryAfterSeconds: number | null,
): ShopifySyncTypedError | null {
  if (status === 409 && detail === 'shopify_full_sync_in_progress') {
    return new ShopifySyncInProgressError()
  }
  if (status === 409 && detail === 'shopify_full_sync_tenant_busy') {
    return new ShopifySyncTenantBusyError()
  }
  if (status === 429 && detail === 'shopify_full_sync_cooldown') {
    return new ShopifySyncCooldownError(retryAfterSeconds)
  }
  if (status === 429 && detail === 'shopify_full_sync_failed_retry_cap') {
    return new ShopifySyncFailedRetryCapError(retryAfterSeconds)
  }
  return null
}

function secondsToCeilHours(seconds: number | null): number {
  if (seconds == null || seconds <= 0) return 0
  return Math.max(1, Math.ceil(seconds / 3600))
}

export function useShopifyIntegration() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { me } = useWorkspace()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()
  const { upsertActivity, removeActivity } = useGlobalActivity()

  const isAdmin = me?.role === 'admin' || me?.role === 'owner'

  const [shopInput, setShopInput] = useState('')

  const defaultSyncFilters = useMemo<ShopifySyncFiltersState>(
    () => ({ storePicker: '' }),
    [],
  )

  const [syncFilters, setSyncFilters] = useTenantPersistedJson(
    tenantId,
    'alenna.shopify.sync.filters',
    defaultSyncFilters,
    parseShopifySyncFilters,
  )
  const { storePicker } = syncFilters

  const [syncPanel, setSyncPanel] = useTenantPersistedJson(
    tenantId,
    'alenna.shopify.sync.panel',
    DEFAULT_SHOPIFY_SYNC_PANEL,
    parseShopifySyncPanel,
  )

  const setStorePicker = useCallback(
    (v: string) => {
      setSyncFilters({ storePicker: v })
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

  const syncPlan: SyncPlan | null = activeConnection?.sync_plan ?? null

  const serverActiveJobId =
    syncPlan?.last_sync_status === 'syncing' ? (syncPlan.current_job_id ?? null) : null

  const localPendingMatchesActive = Boolean(
    syncPanel.pendingJobId &&
      syncPanel.pendingConnectionId &&
      syncPanel.pendingConnectionId === activeConnectionId,
  )

  const effectiveJobId: string | null = localPendingMatchesActive
    ? syncPanel.pendingJobId
    : serverActiveJobId

  const pollShopifyJob = Boolean(effectiveJobId && activeConnectionId)

  const shopifyJobQuery = useCatalogJobQuery(effectiveJobId, pollShopifyJob)

  const retryCatalogJobMutation = useRetryCatalogJobMutation()

  const settledJobSigRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pollShopifyJob || !effectiveJobId) return
    const job = shopifyJobQuery.data
    if (!job || job.id !== effectiveJobId) return

    if (job.status === 'queued' || job.status === 'running') {
      settledJobSigRef.current = null
      return
    }

    const sig = `${job.id}:${job.status}:${job.finished_at ?? ''}`
    if (settledJobSigRef.current === sig) return
    settledJobSigRef.current = sig

    const settledConn = syncPanel.pendingConnectionId ?? activeConnectionId

    if (job.status === 'succeeded' && settledConn) {
      setSyncPanel({
        pendingJobId: null,
        pendingConnectionId: null,
        failedJobId: null,
        failedConnectionId: null,
        failedMessage: null,
        blockSuccess: {
          connectionId: settledConn,
          recordsSynced: job.records_synced ?? 0,
          catalogProductsUpserted: job.catalog_products_upserted ?? 0,
          minOrderDate: job.min_order_date ?? null,
          maxOrderDate: job.max_order_date ?? null,
        },
      })
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      return
    }

    if (job.status === 'failed' && settledConn) {
      setSyncPanel({
        pendingJobId: null,
        pendingConnectionId: null,
        failedJobId: job.id,
        failedConnectionId: settledConn,
        failedMessage: job.error_message ?? shellT(lang, 'syncErrorLabel'),
        blockSuccess: null,
      })
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
    }
  }, [
    pollShopifyJob,
    effectiveJobId,
    syncPanel.pendingConnectionId,
    activeConnectionId,
    shopifyJobQuery.data,
    setSyncPanel,
    queryClient,
    tenantId,
    lang,
  ])

  const shopifySyncPhase = useMemo((): 'idle' | 'working' | 'done_ok' | 'done_fail' => {
    if (!activeConnectionId) return 'idle'
    if (syncPanel.pendingJobId && syncPanel.pendingConnectionId === activeConnectionId) {
      return 'working'
    }
    if (syncPlan?.last_sync_status === 'syncing') {
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
    syncPlan?.last_sync_status,
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

  const syncMutation = useMutation({
    mutationFn: async (): Promise<ShopifySyncEnqueueResponse> => {
      if (!tenantId) throw new Error('No workspace')
      const body: { full: true; platform_connection_id?: string } = { full: true }
      if (shopifyRows.length > 1 && activeConnectionId) {
        body.platform_connection_id = activeConnectionId
      }
      const res = await apiPostJson(
        '/connectors/shopify/sync',
        (a) => getToken(a),
        body,
        {},
        tenantId,
      )
      if (!res.ok) {
        const detail = await readApiErrorDetail(res)
        const retryAfterSeconds = readRetryAfterSeconds(res)
        const typed = buildSyncTypedError(res.status, detail, retryAfterSeconds)
        if (typed) throw typed
        throw new Error(detail ?? res.statusText)
      }
      return (await res.json()) as ShopifySyncEnqueueResponse
    },
    onSuccess: (data) => {
      setSyncMessage(null)
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
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
    },
    onError: (e: Error) => {
      if (e instanceof ShopifySyncInProgressError) {
        toast.error(shellT(lang, 'syncInProgressToast'))
        void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
        return
      }
      if (e instanceof ShopifySyncTenantBusyError) {
        toast.error(shellT(lang, 'syncTenantBusyToast'))
        return
      }
      if (e instanceof ShopifySyncCooldownError) {
        const hours = secondsToCeilHours(e.retryAfterSeconds)
        toast.error(shellT(lang, 'syncCooldownToast', { hours: String(hours) }))
        return
      }
      if (e instanceof ShopifySyncFailedRetryCapError) {
        const hours = secondsToCeilHours(e.retryAfterSeconds)
        toast.error(shellT(lang, 'syncFailedRetryCapToast', { hours: String(hours) }))
        return
      }
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

  const { ordersProcessed, oldestProcessedYear } = extractShopifyJobProgressInfo(
    shopifyJobQuery.data,
  )

  return {
    lang,
    tenantId,
    isAdmin,
    shopInput,
    setShopInput,
    storePicker,
    setStorePicker,
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
    syncMutation,
    disconnectMutation,
    neverLabel,
    lastSyncDisplay,
    shopifySyncPhase,
    shopifyJobQuery,
    ordersProcessed,
    oldestProcessedYear,
    syncPanelBlockSuccess: syncPanel.blockSuccess,
    syncFailedMessage: syncPanel.failedMessage,
    retryShopifySync,
    retryShopifySyncPending: retryCatalogJobMutation.isPending,
    syncPlan,
  }
}
