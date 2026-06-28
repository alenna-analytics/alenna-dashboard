import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { apiFetch, apiPostJson } from '@/lib/api'
import { formatShopifyLastSync } from '@/lib/integrations/shopify-format'
import { formatMercadoLibreSyncUserError } from '@/lib/integrations/mercadolibre-sync-user-error'
import type { PlatformConnection, SyncPlan } from '@/lib/types/connectors'
import { shellT } from '@/lib/i18n/shell-strings'
import { invalidateAlertsQueries } from '@/pages/dashboard/use-alerts-queries'
import { useCatalogJobQuery, useRetryCatalogJobMutation } from '@/pages/products/use-catalog-queries'
import {
  GLOBAL_ACTIVITY_MELI_SYNC_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'

type MercadoLibreSyncEnqueueResponse = {
  job_id: string
  status: string
}

type MercadoLibreSyncBlockSuccess = {
  connectionId: string
  recordsSynced: number
  catalogListingsUpserted: number
  minOrderDate: string | null
  maxOrderDate: string | null
}

export type MercadoLibreSyncPanelState = {
  pendingJobId: string | null
  pendingConnectionId: string | null
  failedJobId: string | null
  failedConnectionId: string | null
  failedMessage: string | null
  blockSuccess: MercadoLibreSyncBlockSuccess | null
}

const DEFAULT_MELI_SYNC_PANEL: MercadoLibreSyncPanelState = {
  pendingJobId: null,
  pendingConnectionId: null,
  failedJobId: null,
  failedConnectionId: null,
  failedMessage: null,
  blockSuccess: null,
}

function parseMercadoLibreSyncPanel(raw: unknown): MercadoLibreSyncPanelState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  let blockSuccess: MercadoLibreSyncBlockSuccess | null = null
  if (o.blockSuccess && typeof o.blockSuccess === 'object') {
    const b = o.blockSuccess as Record<string, unknown>
    if (typeof b.connectionId === 'string' && typeof b.recordsSynced === 'number') {
      blockSuccess = {
        connectionId: b.connectionId,
        recordsSynced: b.recordsSynced,
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

function blockSuccessFromSyncPlan(conn: PlatformConnection): MercadoLibreSyncBlockSuccess | null {
  const plan = conn.sync_plan
  if (!plan) return null
  if (plan.last_sync_status !== 'synced' && plan.last_sync_status !== 'partial') return null
  const minRaw = plan.actual_min_created_at
  const maxRaw = plan.actual_max_created_at
  return {
    connectionId: conn.id,
    recordsSynced: plan.last_sync_records_count ?? 0,
    catalogListingsUpserted: 0,
    minOrderDate: minRaw ? minRaw.slice(0, 10) : null,
    maxOrderDate: maxRaw ? maxRaw.slice(0, 10) : null,
  }
}

export type MercadoLibreIntegrationHook = ReturnType<typeof useMercadoLibreIntegration>

export function useMercadoLibreIntegration() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { me } = useWorkspace()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()
  const { upsertActivity, removeActivity } = useGlobalActivity()
  const [oauthStarting, setOauthStarting] = useState(false)

  const [syncPanel, setSyncPanel] = useTenantPersistedJson(
    tenantId,
    'alenna.mercadolibre.sync.panel',
    DEFAULT_MELI_SYNC_PANEL,
    parseMercadoLibreSyncPanel,
  )

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
  const syncPlan: SyncPlan | null = activeConnection?.sync_plan ?? null
  const neverLabel = shellT(lang, 'integrationDetailLastSyncNever')
  const lastSyncDisplay = formatShopifyLastSync(
    activeConnection?.last_synced_at,
    lang,
    neverLabel,
  )

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

  const pollMeliJob = Boolean(effectiveJobId && activeConnectionId)
  const meliJobQuery = useCatalogJobQuery(effectiveJobId, pollMeliJob)
  const retryCatalogJobMutation = useRetryCatalogJobMutation()
  const settledJobSigRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pollMeliJob || !effectiveJobId) return
    const job = meliJobQuery.data
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
          catalogListingsUpserted: job.catalog_products_upserted ?? 0,
          minOrderDate: job.min_order_date ?? null,
          maxOrderDate: job.max_order_date ?? null,
        },
      })
      upsertActivity({
        id: GLOBAL_ACTIVITY_MELI_SYNC_ID,
        phase: 'success',
        title: shellT(lang, 'meliSyncProgressTitle'),
        subtitle:
          (job.records_synced ?? 0) > 0
            ? `${(job.records_synced ?? 0).toLocaleString()} ${shellT(lang, 'reportsOrders')}`
            : shellT(lang, 'meliSyncToastSuccess'),
        href: '/dashboard/integrations/mercadolibre?tab=settings',
        minimized: false,
      })
      toast.success(shellT(lang, 'meliSyncToastSuccess'))
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      invalidateAlertsQueries(queryClient, tenantId)
      return
    }

    if (job.status === 'failed' && settledConn) {
      const failedMessage = formatMercadoLibreSyncUserError(job.error_message, lang)
      setSyncPanel({
        pendingJobId: null,
        pendingConnectionId: null,
        failedJobId: job.id,
        failedConnectionId: settledConn,
        failedMessage,
        blockSuccess: null,
      })
      upsertActivity({
        id: GLOBAL_ACTIVITY_MELI_SYNC_ID,
        phase: 'error',
        title: shellT(lang, 'meliSyncFailedTitle'),
        subtitle: failedMessage,
        href: '/dashboard/integrations/mercadolibre?tab=settings',
        minimized: false,
      })
      toast.error(shellT(lang, 'meliSyncToastFailed'))
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
    }
  }, [
    pollMeliJob,
    effectiveJobId,
    syncPanel.pendingConnectionId,
    activeConnectionId,
    meliJobQuery.data,
    setSyncPanel,
    upsertActivity,
    queryClient,
    tenantId,
    lang,
  ])

  const syncPanelBlockSuccess = useMemo((): MercadoLibreSyncBlockSuccess | null => {
    if (syncPanel.blockSuccess?.connectionId === activeConnectionId) {
      return syncPanel.blockSuccess
    }
    if (activeConnection) {
      return blockSuccessFromSyncPlan(activeConnection)
    }
    return null
  }, [syncPanel.blockSuccess, activeConnectionId, activeConnection])

  const meliSyncPhase = useMemo((): 'idle' | 'working' | 'done_ok' | 'done_fail' => {
    if (!activeConnectionId) return 'idle'
    if (
      syncPanel.failedJobId &&
      syncPanel.failedConnectionId === activeConnectionId &&
      !syncPanel.pendingJobId
    ) {
      return 'done_fail'
    }
    if (syncPanel.pendingJobId && syncPanel.pendingConnectionId === activeConnectionId) {
      return 'working'
    }
    if (syncPlan?.last_sync_status === 'syncing') return 'working'
    if (syncPanelBlockSuccess?.connectionId === activeConnectionId) return 'done_ok'
    if (syncPlan?.last_sync_status === 'failed') return 'done_fail'
    return 'idle'
  }, [
    activeConnectionId,
    syncPanel,
    syncPlan?.last_sync_status,
    syncPanelBlockSuccess,
  ])

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
      setSyncPanel({ ...DEFAULT_MELI_SYNC_PANEL })
      removeActivity(GLOBAL_ACTIVITY_MELI_SYNC_ID)
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      toast.success(shellT(lang, 'integrationDisconnectDone'))
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Disconnect failed')
    },
  })

  const syncMutation = useMutation({
    mutationFn: async (): Promise<MercadoLibreSyncEnqueueResponse> => {
      if (!activeConnectionId) {
        throw new Error(shellT(lang, 'integrationsStatusNotConnected'))
      }
      const res = await apiPostJson(
        '/connectors/mercadolibre/sync',
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
      return (await res.json()) as MercadoLibreSyncEnqueueResponse
    },
    onSuccess: (data) => {
      upsertActivity({
        id: GLOBAL_ACTIVITY_MELI_SYNC_ID,
        phase: 'loading',
        title: shellT(lang, 'meliSyncProgressTitle'),
        subtitle: shellT(lang, 'meliSyncProgressQueued'),
        href: '/dashboard/integrations/mercadolibre?tab=settings',
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
      const message = formatMercadoLibreSyncUserError(e.message, lang)
      toast.error(message)
      upsertActivity({
        id: GLOBAL_ACTIVITY_MELI_SYNC_ID,
        phase: 'error',
        title: shellT(lang, 'meliSyncFailedTitle'),
        subtitle: message,
        href: '/dashboard/integrations/mercadolibre?tab=settings',
        minimized: false,
      })
    },
  })

  const retryMercadoLibreSync = useCallback(() => {
    const fid = syncPanel.failedJobId
    const fc = syncPanel.failedConnectionId
    if (!fid || !fc) return
    retryCatalogJobMutation.mutate(fid, {
      onSuccess: () => {
        upsertActivity({
          id: GLOBAL_ACTIVITY_MELI_SYNC_ID,
          phase: 'loading',
          title: shellT(lang, 'meliSyncProgressTitle'),
          subtitle: shellT(lang, 'meliSyncProgressQueued'),
          href: '/dashboard/integrations/mercadolibre?tab=settings',
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
  }, [retryCatalogJobMutation, syncPanel.failedJobId, syncPanel.failedConnectionId, setSyncPanel, upsertActivity, lang])

  const meliJobProgress = meliJobQuery.data?.progress
  const ordersProcessed =
    typeof meliJobProgress?.orders_processed === 'number'
      ? meliJobProgress.orders_processed
      : null

  return {
    isAdmin,
    connected,
    activeConnectionId,
    activeConnection,
    syncPlan,
    meliSyncPhase,
    meliJobQuery,
    ordersProcessed,
    syncPanelBlockSuccess,
    syncFailedMessage: syncPanel.failedMessage,
    retryMercadoLibreSync,
    retryMercadoLibreSyncPending: retryCatalogJobMutation.isPending,
    isLoading,
    error,
    lastSyncDisplay,
    oauthStarting,
    startOAuth,
    disconnectMutation,
    syncMutation,
  }
}
