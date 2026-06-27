import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import { formatMercadoLibreSyncUserError } from '@/lib/integrations/mercadolibre-sync-user-error'
import { isStaleSyncingPlan } from '@/lib/integrations/sync-freshness'
import type { PlatformConnection } from '@/lib/types/connectors'
import { invalidateAlertsQueries } from '@/pages/dashboard/use-alerts-queries'
import { useCatalogJobQuery } from '@/pages/products/use-catalog-queries'
import {
  GLOBAL_ACTIVITY_MELI_SYNC_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { useLanguage } from '@/shell/providers/language-provider'

const BANNER_ERROR_SUBTITLE_MAX = 160

function isActiveMercadoLibreConnection(conn: PlatformConnection): boolean {
  return (
    conn.platform === 'mercadolibre' &&
    conn.status === 'active' &&
    conn.connection_status === 'active'
  )
}

function truncateBannerError(message: string): string {
  const oneLine = message.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= BANNER_ERROR_SUBTITLE_MAX) return oneLine
  return `${oneLine.slice(0, BANNER_ERROR_SUBTITLE_MAX - 1)}…`
}

function pickSyncingMercadoLibre(
  connections: PlatformConnection[] | undefined,
): PlatformConnection | null {
  if (!connections?.length) return null
  for (const c of connections) {
    if (!isActiveMercadoLibreConnection(c)) continue
    const plan = c.sync_plan
    if (!plan) continue
    const status = plan.last_sync_status
    if (status === 'failed' || status === 'synced' || status === 'partial') continue
    if (plan.current_job_id) return c
    if (status === 'syncing' && !isStaleSyncingPlan(c)) return c
  }
  return null
}

function pickFailedMercadoLibre(
  connections: PlatformConnection[] | undefined,
): PlatformConnection | null {
  if (!connections?.length) return null
  for (const c of connections) {
    if (!isActiveMercadoLibreConnection(c)) continue
    if (c.sync_plan?.last_sync_status === 'failed') return c
  }
  return null
}

function pickCompletedMercadoLibre(
  connections: PlatformConnection[] | undefined,
): PlatformConnection | null {
  if (!connections?.length) return null
  for (const c of connections) {
    if (!isActiveMercadoLibreConnection(c)) continue
    const status = c.sync_plan?.last_sync_status
    if (status === 'synced' || status === 'partial') return c
  }
  return null
}

function meliSyncErrorSubtitle(
  conn: PlatformConnection | null | undefined,
  jobError: string | null | undefined,
  lang: Parameters<typeof formatMercadoLibreSyncUserError>[1],
): string {
  const raw = formatMercadoLibreSyncUserError(jobError ?? conn?.last_error ?? null, lang)
  return truncateBannerError(raw)
}

function buildCompletedSyncSubtitle(
  conn: PlatformConnection,
  lang: Parameters<typeof formatMercadoLibreSyncUserError>[1],
): string {
  const count = conn.sync_plan?.last_sync_records_count
  if (count != null && count > 0) {
    return `${count.toLocaleString()} ${shellT(lang, 'reportsOrders')}`
  }
  return shellT(lang, 'meliSyncToastSuccess')
}

export function useMercadoLibreSyncBanner(
  connections: PlatformConnection[] | undefined,
): void {
  const { lang } = useLanguage()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()
  const { upsertActivity, removeActivity, items } = useGlobalActivity()

  const syncingConn = useMemo(() => pickSyncingMercadoLibre(connections), [connections])
  const failedConn = useMemo(() => pickFailedMercadoLibre(connections), [connections])
  const completedConn = useMemo(() => pickCompletedMercadoLibre(connections), [connections])
  const serverJobId = syncingConn?.sync_plan?.current_job_id ?? null

  const existingMeliActivity = items.find((x) => x.id === GLOBAL_ACTIVITY_MELI_SYNC_ID)
  const [lastSeenJobId, setLastSeenJobId] = useState<string | null>(null)
  const [prevServerJobId, setPrevServerJobId] = useState<string | null>(serverJobId)

  if (serverJobId !== prevServerJobId) {
    setPrevServerJobId(serverJobId)
    if (serverJobId) setLastSeenJobId(serverJobId)
  }

  if (!serverJobId && existingMeliActivity?.phase !== 'loading' && lastSeenJobId !== null) {
    setLastSeenJobId(null)
  }

  const pollJobId =
    serverJobId ?? (existingMeliActivity?.phase === 'loading' ? lastSeenJobId : null)

  const shouldPollJob = Boolean(
    pollJobId && (syncingConn || existingMeliActivity?.phase === 'loading'),
  )

  const jobQuery = useCatalogJobQuery(pollJobId, shouldPollJob)

  const lastLoadingSubtitleRef = useRef<string | null>(null)
  const settledSigRef = useRef<string | null>(null)

  useEffect(() => {
    const job = jobQuery.data
    const existing = items.find((x) => x.id === GLOBAL_ACTIVITY_MELI_SYNC_ID)

    const markSettled = () => {
      lastLoadingSubtitleRef.current = null
    }

    if (job?.status === 'failed') {
      const sig = `${job.id}:failed:${job.finished_at ?? ''}`
      if (settledSigRef.current !== sig) {
        settledSigRef.current = sig
        markSettled()
        upsertActivity({
          id: GLOBAL_ACTIVITY_MELI_SYNC_ID,
          phase: 'error',
          title: shellT(lang, 'meliSyncFailedTitle'),
          subtitle: meliSyncErrorSubtitle(syncingConn ?? failedConn, job.error_message, lang),
          href: '/dashboard/integrations/mercadolibre?tab=settings',
        })
        toast.error(shellT(lang, 'meliSyncToastFailed'))
        void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      }
      return
    }

    if (job?.status === 'succeeded') {
      const sig = `${job.id}:succeeded:${job.finished_at ?? ''}`
      if (settledSigRef.current !== sig) {
        settledSigRef.current = sig
        markSettled()
        const records = job.records_synced ?? 0
        const subtitle =
          records > 0
            ? `${records.toLocaleString()} ${shellT(lang, 'reportsOrders')}`
            : shellT(lang, 'meliSyncToastSuccess')
        upsertActivity({
          id: GLOBAL_ACTIVITY_MELI_SYNC_ID,
          phase: 'success',
          title: shellT(lang, 'meliSyncProgressTitle'),
          subtitle,
          href: '/dashboard/integrations/mercadolibre?tab=settings',
        })
        toast.success(shellT(lang, 'meliSyncToastSuccess'))
        void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
        invalidateAlertsQueries(queryClient, tenantId)
      }
      return
    }

    if (job?.status === 'queued' || job?.status === 'running') {
      settledSigRef.current = null
    }

    if (
      completedConn &&
      existing?.phase === 'loading' &&
      (!job || (job.status !== 'queued' && job.status !== 'running'))
    ) {
      const sig = `completed:${completedConn.id}:${completedConn.sync_plan?.last_sync_completed_at ?? ''}`
      if (settledSigRef.current !== sig) {
        settledSigRef.current = sig
        markSettled()
        upsertActivity({
          id: GLOBAL_ACTIVITY_MELI_SYNC_ID,
          phase: 'success',
          title: shellT(lang, 'meliSyncProgressTitle'),
          subtitle: buildCompletedSyncSubtitle(completedConn, lang),
          href: '/dashboard/integrations/mercadolibre?tab=settings',
        })
        toast.success(shellT(lang, 'meliSyncToastSuccess'))
        invalidateAlertsQueries(queryClient, tenantId)
      }
      return
    }

    if (!syncingConn) {
      lastLoadingSubtitleRef.current = null
      if (failedConn) {
        const subtitle = meliSyncErrorSubtitle(failedConn, null, lang)
        if (existing?.phase === 'error' && existing.subtitle === subtitle) return
        upsertActivity({
          id: GLOBAL_ACTIVITY_MELI_SYNC_ID,
          phase: 'error',
          title: shellT(lang, 'meliSyncFailedTitle'),
          subtitle,
          href: '/dashboard/integrations/mercadolibre?tab=settings',
        })
        return
      }
      if (existing?.phase === 'loading') {
        removeActivity(GLOBAL_ACTIVITY_MELI_SYNC_ID)
      }
      return
    }

    if (existing?.phase === 'error' || existing?.phase === 'success') {
      return
    }

    let subtitle: string
    if (!job || (job.status !== 'queued' && job.status !== 'running')) {
      subtitle = shellT(lang, 'meliSyncProgressQueued')
    } else {
      const processed = job.progress?.orders_processed
      subtitle =
        typeof processed === 'number' && processed > 0
          ? `${processed.toLocaleString()} ${shellT(lang, 'shopifySyncProgressOrders')}`
          : shellT(lang, 'meliSyncProgressQueued')
    }
    if (lastLoadingSubtitleRef.current === subtitle) return
    lastLoadingSubtitleRef.current = subtitle
    upsertActivity({
      id: GLOBAL_ACTIVITY_MELI_SYNC_ID,
      phase: 'loading',
      title: shellT(lang, 'meliSyncProgressTitle'),
      subtitle,
      href: '/dashboard/integrations/mercadolibre?tab=settings',
    })
  }, [
    syncingConn,
    failedConn,
    completedConn,
    jobQuery.data,
    upsertActivity,
    removeActivity,
    items,
    lang,
    queryClient,
    tenantId,
  ])
}
