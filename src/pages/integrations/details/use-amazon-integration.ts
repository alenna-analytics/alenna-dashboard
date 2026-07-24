import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { apiFetch, apiPostJson } from '@/lib/api'
import { isAmazonSandboxConnectMode } from '@/lib/integrations/amazon-connect-mode'
import { connectionNeedsInitialSync } from '@/lib/integrations/sync-freshness'
import { formatShopifyLastSync } from '@/lib/integrations/shopify-format'
import { formatAmazonSyncUserError, amazonSyncFailedTitle } from '@/lib/integrations/amazon-sync-user-error'
import { mercadoLibreSyncSummaryLine } from '@/lib/integrations/mercadolibre-sync-summary'
import { isPlatformSyncUserCancelled } from '@/lib/integrations/platform-sync-user-error'
import type { PlatformConnection, SyncPlan } from '@/lib/types/connectors'
import { shellT } from '@/lib/i18n/shell-strings'
import { invalidateAlertsQueries } from '@/pages/dashboard/use-alerts-queries'
import { useCatalogJobQuery, useRetryCatalogJobMutation } from '@/pages/products/use-catalog-queries'
import {
  GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'

type AmazonSyncEnqueueResponse = {
  job_id: string
  status: string
}

type AmazonSyncBlockSuccess = {
  connectionId: string
  recordsSynced: number
  recordsTouched: number | null
  catalogListingsUpserted: number
  minOrderDate: string | null
  maxOrderDate: string | null
}

export type AmazonSyncPanelState = {
  pendingJobId: string | null
  pendingConnectionId: string | null
  failedJobId: string | null
  failedConnectionId: string | null
  failedMessage: string | null
  blockSuccess: AmazonSyncBlockSuccess | null
}

const DEFAULT_AMAZON_SYNC_PANEL: AmazonSyncPanelState = {
  pendingJobId: null,
  pendingConnectionId: null,
  failedJobId: null,
  failedConnectionId: null,
  failedMessage: null,
  blockSuccess: null,
}

function parseAmazonSyncPanel(raw: unknown): AmazonSyncPanelState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  let blockSuccess: AmazonSyncBlockSuccess | null = null
  if (o.blockSuccess && typeof o.blockSuccess === 'object') {
    const b = o.blockSuccess as Record<string, unknown>
    if (typeof b.connectionId === 'string' && typeof b.recordsSynced === 'number') {
      blockSuccess = {
        connectionId: b.connectionId,
        recordsSynced: b.recordsSynced,
        recordsTouched: typeof b.recordsTouched === 'number' ? b.recordsTouched : null,
        catalogListingsUpserted:
          typeof b.catalogListingsUpserted === 'number' ? b.catalogListingsUpserted : 0,
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

function blockSuccessFromSyncPlan(conn: PlatformConnection): AmazonSyncBlockSuccess | null {
  const plan = conn.sync_plan
  if (!plan) return null
  if (plan.last_sync_status !== 'synced' && plan.last_sync_status !== 'partial') return null
  const minRaw = plan.actual_min_created_at
  const maxRaw = plan.actual_max_created_at
  return {
    connectionId: conn.id,
    recordsSynced: plan.last_sync_records_count ?? 0,
    recordsTouched: plan.last_sync_records_touched_count,
    catalogListingsUpserted: 0,
    minOrderDate: minRaw ? minRaw.slice(0, 10) : null,
    maxOrderDate: maxRaw ? maxRaw.slice(0, 10) : null,
  }
}

export type AmazonIntegrationHook = ReturnType<typeof useAmazonIntegration>

export function useAmazonIntegration() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { me } = useWorkspace()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()
  const { upsertActivity, removeActivity, items } = useGlobalActivity()
  const [connectStarting, setConnectStarting] = useState(false)

  const [syncPanel, setSyncPanel] = useTenantPersistedJson(
    tenantId,
    'alenna.amazon.sync.panel',
    DEFAULT_AMAZON_SYNC_PANEL,
    parseAmazonSyncPanel,
  )

  const isAdmin = me?.role === 'admin' || me?.role === 'owner'
  const sandboxConnect = isAmazonSandboxConnectMode()

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

  const amazonRows = useMemo(
    () =>
      (connections ?? []).filter(
        (c) =>
          c.platform === 'amazon' &&
          c.status === 'active' &&
          c.connection_status === 'active',
      ),
    [connections],
  )

  const hasConnection = amazonRows.length > 0
  const activeConnection = amazonRows[0] ?? null
  const connected =
    hasConnection && !connectionNeedsInitialSync(activeConnection)
  const activeConnectionId = activeConnection?.id ?? ''
  const feesUnavailable = activeConnection?.fees_status === 'unavailable'
  const syncPlan: SyncPlan | null = activeConnection?.sync_plan ?? null
  const neverLabel = shellT(lang, 'integrationDetailLastSyncNever')
  const lastSyncDisplay = formatShopifyLastSync(
    activeConnection?.last_synced_at,
    lang,
    neverLabel,
  )

  const serverActiveJobId = syncPlan?.current_job_id ?? null

  const localPendingMatchesActive = Boolean(
    syncPanel.pendingJobId &&
      syncPanel.pendingConnectionId &&
      syncPanel.pendingConnectionId === activeConnectionId,
  )

  const effectiveJobId: string | null = localPendingMatchesActive
    ? syncPanel.pendingJobId
    : serverActiveJobId

  const pollAmazonJob = Boolean(effectiveJobId && activeConnectionId)
  const amazonJobQuery = useCatalogJobQuery(effectiveJobId, pollAmazonJob)
  const liveJobStatus = amazonJobQuery.data?.status ?? null
  const retryCatalogJobMutation = useRetryCatalogJobMutation()
  const settledJobSigRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pollAmazonJob || !effectiveJobId) return
    const job = amazonJobQuery.data
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
          recordsTouched: job.records_touched_count ?? job.records_synced ?? 0,
          catalogListingsUpserted: job.catalog_products_upserted ?? 0,
          minOrderDate: job.min_order_date ?? null,
          maxOrderDate: job.max_order_date ?? null,
        },
      })
      const summaryLine = mercadoLibreSyncSummaryLine(
        {
          recordsSynced: job.records_synced ?? 0,
          recordsTouched: job.records_touched_count ?? job.records_synced ?? 0,
          catalogListingsUpserted: job.catalog_products_upserted ?? 0,
        },
        lang,
      )
      upsertActivity({
        id: GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
        phase: 'success',
        title: shellT(lang, 'amazonSyncProgressTitle'),
        subtitle: summaryLine,
        href: '/dashboard/integrations/amazon?tab=settings',
        minimized: true,
      })
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      invalidateAlertsQueries(queryClient, tenantId)
    }

    if (job.status === 'failed') {
      const cancelled = isPlatformSyncUserCancelled(job.error_code, job.error_message)
      const message = formatAmazonSyncUserError(job.error_message, lang, job.error_code)
      setSyncPanel({
        pendingJobId: null,
        pendingConnectionId: null,
        failedJobId: job.id,
        failedConnectionId: settledConn,
        failedMessage: message,
        blockSuccess: null,
      })
      upsertActivity({
        id: GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
        phase: 'error',
        title: amazonSyncFailedTitle(lang, job.error_code, job.error_message),
        subtitle: message,
        href: '/dashboard/integrations/amazon?tab=settings',
        minimized: false,
      })
      if (!cancelled) {
        toast.error(shellT(lang, 'amazonSyncToastFailed'))
      }
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
    }
  }, [
    pollAmazonJob,
    effectiveJobId,
    syncPanel.pendingConnectionId,
    activeConnectionId,
    amazonJobQuery.data,
    setSyncPanel,
    upsertActivity,
    queryClient,
    tenantId,
    lang,
  ])

  const syncPanelBlockSuccess = useMemo((): AmazonSyncBlockSuccess | null => {
    if (syncPanel.blockSuccess?.connectionId === activeConnectionId) {
      return syncPanel.blockSuccess
    }
    if (activeConnection) {
      return blockSuccessFromSyncPlan(activeConnection)
    }
    return null
  }, [syncPanel.blockSuccess, activeConnectionId, activeConnection])

  const amazonSyncPhase = useMemo((): 'idle' | 'working' | 'done_ok' | 'done_fail' => {
    if (!activeConnectionId) return 'idle'

    // Live job wins over localStorage / summary — avoids "En cola" + Retry split.
    if (effectiveJobId && liveJobStatus === 'queued') return 'working'
    if (effectiveJobId && liveJobStatus === 'running') return 'working'
    if (effectiveJobId && liveJobStatus === 'failed') return 'done_fail'
    if (effectiveJobId && liveJobStatus === 'succeeded') return 'done_ok'

    if (
      syncPanel.failedJobId &&
      syncPanel.failedConnectionId === activeConnectionId &&
      !syncPanel.pendingJobId
    ) {
      return 'done_fail'
    }

    const pendingMatches =
      syncPanel.pendingJobId &&
      syncPanel.pendingConnectionId === activeConnectionId
    if (pendingMatches && !liveJobStatus) return 'working'

    if (syncPlan?.current_job_id && !liveJobStatus) return 'working'
    if (syncPlan?.last_sync_status === 'syncing') return 'working'
    if (syncPanelBlockSuccess?.connectionId === activeConnectionId) return 'done_ok'
    if (syncPlan?.last_sync_status === 'failed') return 'done_fail'
    return 'idle'
  }, [
    activeConnectionId,
    syncPanel,
    syncPlan?.last_sync_status,
    syncPlan?.current_job_id,
    syncPanelBlockSuccess,
    liveJobStatus,
    effectiveJobId,
  ])

  useEffect(() => {
    if (amazonSyncPhase !== 'done_fail' && amazonSyncPhase !== 'done_ok') return
    const existing = items.find((x) => x.id === GLOBAL_ACTIVITY_AMAZON_SYNC_ID)
    if (existing?.phase === 'loading') {
      removeActivity(GLOBAL_ACTIVITY_AMAZON_SYNC_ID)
    }
  }, [amazonSyncPhase, items, removeActivity])

  const startConnect = useCallback(async () => {
    setConnectStarting(true)
    try {
      if (sandboxConnect) {
        const res = await apiPostJson(
          '/connectors/amazon/sandbox-connect',
          (a) => getToken(a),
          {},
          {},
          tenantId,
        )
        if (!res.ok) {
          const t = await res.text()
          throw new Error(t || res.statusText)
        }
        void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
        toast.success(shellT(lang, 'integrationAmazonSandboxConnected'))
        setConnectStarting(false)
        return
      }
      const res = await apiFetch(
        '/connectors/amazon/authorization-url',
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
      setConnectStarting(false)
    }
  }, [getToken, tenantId, sandboxConnect, queryClient, lang])

  const disconnectMutation = useMutation({
    mutationFn: async (purgeData: boolean) => {
      if (!activeConnectionId) return
      const res = await apiFetch(
        `/connectors/amazon/${activeConnectionId}?purge_data=${purgeData ? 'true' : 'false'}`,
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
      setSyncPanel({ ...DEFAULT_AMAZON_SYNC_PANEL })
      removeActivity(GLOBAL_ACTIVITY_AMAZON_SYNC_ID)
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      toast.success(shellT(lang, 'integrationDisconnectDone'))
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Disconnect failed')
    },
  })

  const syncMutation = useMutation({
    mutationFn: async (): Promise<AmazonSyncEnqueueResponse> => {
      if (!activeConnectionId) {
        throw new Error(shellT(lang, 'integrationsStatusNotConnected'))
      }
      const res = await apiPostJson(
        '/connectors/amazon/sync',
        (a) => getToken(a),
        { full: true, platform_connection_id: activeConnectionId },
        {},
        tenantId,
      )
      if (res.status === 409) {
        throw new Error(shellT(lang, 'syncInProgressToast'))
      }
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as AmazonSyncEnqueueResponse
    },
    onSuccess: (data) => {
      upsertActivity({
        id: GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
        phase: 'loading',
        title: shellT(lang, 'amazonSyncProgressTitle'),
        subtitle: shellT(lang, 'amazonSyncProgressQueued'),
        href: '/dashboard/integrations/amazon?tab=settings',
        minimized: false,
        jobId: data.job_id,
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
      toast.error(e.message)
      upsertActivity({
        id: GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
        phase: 'error',
        title: shellT(lang, 'amazonSyncFailedTitle'),
        subtitle: e.message,
        href: '/dashboard/integrations/amazon?tab=settings',
        minimized: false,
      })
    },
  })

  const retryAmazonSync = useCallback(() => {
    const fid = syncPanel.failedJobId
    const fc = syncPanel.failedConnectionId
    if (!fid || !fc) return
    retryCatalogJobMutation.mutate(fid, {
      onSuccess: () => {
        upsertActivity({
          id: GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
          phase: 'loading',
          title: shellT(lang, 'amazonSyncProgressTitle'),
          subtitle: shellT(lang, 'amazonSyncProgressQueued'),
          href: '/dashboard/integrations/amazon?tab=settings',
          minimized: false,
          jobId: fid,
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
  }, [retryCatalogJobMutation, syncPanel.failedJobId, syncPanel.failedConnectionId, setSyncPanel, upsertActivity, lang])

  const amazonJobProgress = amazonJobQuery.data?.progress
  const ordersProcessed =
    typeof amazonJobProgress?.orders_processed === 'number'
      ? amazonJobProgress.orders_processed
      : null

  return {
    isAdmin,
    hasConnection,
    connected,
    activeConnectionId,
    activeConnection,
    feesUnavailable,
    syncPlan,
    amazonSyncPhase,
    amazonJobQuery,
    ordersProcessed,
    syncPanelBlockSuccess,
    syncFailedMessage: syncPanel.failedMessage,
    retryAmazonSync,
    retryAmazonSyncPending: retryCatalogJobMutation.isPending,
    isLoading,
    error,
    lastSyncDisplay,
    connectStarting,
    sandboxConnect,
    startConnect,
    disconnectMutation,
    syncMutation,
    activeSyncJobId: effectiveJobId,
  }
}
