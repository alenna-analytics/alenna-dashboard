import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import { formatShopifySyncUserError } from '@/lib/integrations/shopify-sync-user-error'
import { isStaleSyncingPlan } from '@/lib/integrations/sync-freshness'
import {
  buildShopifyProgressSubtitle,
  buildShopifySuccessSubtitle,
} from '@/lib/integrations/shopify-job-progress'
import type { PlatformConnection } from '@/lib/types/connectors'
import { useCatalogJobQuery } from '@/pages/products/use-catalog-queries'
import {
  GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { useLanguage } from '@/shell/providers/language-provider'

const BANNER_ERROR_SUBTITLE_MAX = 160

function isActiveShopifyConnection(conn: PlatformConnection): boolean {
  return (
    conn.platform === 'shopify' &&
    conn.status === 'active' &&
    conn.connection_status === 'active'
  )
}

function truncateBannerError(message: string): string {
  const oneLine = message.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= BANNER_ERROR_SUBTITLE_MAX) return oneLine
  return `${oneLine.slice(0, BANNER_ERROR_SUBTITLE_MAX - 1)}…`
}

function pickSyncingShopify(
  connections: PlatformConnection[] | undefined,
): PlatformConnection | null {
  if (!connections?.length) return null
  for (const c of connections) {
    if (!isActiveShopifyConnection(c)) continue
    const plan = c.sync_plan
    if (!plan) continue
    const status = plan.last_sync_status
    if (status === 'failed' || status === 'synced' || status === 'partial') continue
    if (plan.current_job_id) return c
    if (status === 'syncing' && !isStaleSyncingPlan(c)) return c
  }
  return null
}

function pickFailedShopify(
  connections: PlatformConnection[] | undefined,
): PlatformConnection | null {
  if (!connections?.length) return null
  for (const c of connections) {
    if (!isActiveShopifyConnection(c)) continue
    if (c.sync_plan?.last_sync_status === 'failed') return c
  }
  return null
}

function pickCompletedShopify(
  connections: PlatformConnection[] | undefined,
): PlatformConnection | null {
  if (!connections?.length) return null
  for (const c of connections) {
    if (!isActiveShopifyConnection(c)) continue
    const status = c.sync_plan?.last_sync_status
    if (status === 'synced' || status === 'partial') return c
  }
  return null
}

function shopifySyncErrorSubtitle(
  conn: PlatformConnection | null | undefined,
  jobError: string | null | undefined,
  lang: Parameters<typeof formatShopifySyncUserError>[1],
): string {
  const raw = formatShopifySyncUserError(
    jobError ?? conn?.last_error ?? null,
    lang,
  )
  return truncateBannerError(raw)
}

function buildCompletedSyncSubtitle(
  conn: PlatformConnection,
  lang: Parameters<typeof formatShopifySyncUserError>[1],
): string {
  const count = conn.sync_plan?.last_sync_records_count
  if (count != null && count > 0) {
    return `${count.toLocaleString()} ${shellT(lang, 'reportsOrders')}`
  }
  return shellT(lang, 'shopifySyncToastSuccess')
}

export function useShopifySyncBanner(
  connections: PlatformConnection[] | undefined,
): void {
  const { lang } = useLanguage()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()
  const { upsertActivity, removeActivity, items } = useGlobalActivity()

  const syncingConn = useMemo(() => pickSyncingShopify(connections), [connections])
  const failedConn = useMemo(() => pickFailedShopify(connections), [connections])
  const completedConn = useMemo(() => pickCompletedShopify(connections), [connections])
  const serverJobId = syncingConn?.sync_plan?.current_job_id ?? null

  const existingShopifyActivity = items.find((x) => x.id === GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID)
  const [lastSeenJobId, setLastSeenJobId] = useState<string | null>(null)
  const [prevServerJobId, setPrevServerJobId] = useState<string | null>(serverJobId)

  if (serverJobId !== prevServerJobId) {
    setPrevServerJobId(serverJobId)
    if (serverJobId) setLastSeenJobId(serverJobId)
  }

  if (
    !serverJobId &&
    existingShopifyActivity?.phase !== 'loading' &&
    lastSeenJobId !== null
  ) {
    setLastSeenJobId(null)
  }

  const pollJobId =
    serverJobId ??
    (existingShopifyActivity?.phase === 'loading' ? lastSeenJobId : null)

  const shouldPollJob = Boolean(
    pollJobId &&
      (syncingConn || existingShopifyActivity?.phase === 'loading'),
  )

  const jobQuery = useCatalogJobQuery(pollJobId, shouldPollJob)

  const lastLoadingSubtitleRef = useRef<string | null>(null)
  const settledSigRef = useRef<string | null>(null)

  useEffect(() => {
    const job = jobQuery.data
    const existing = items.find((x) => x.id === GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID)

    const markSettled = () => {
      lastLoadingSubtitleRef.current = null
    }

    if (job?.status === 'failed') {
      const sig = `${job.id}:failed:${job.finished_at ?? ''}`
      if (settledSigRef.current !== sig) {
        settledSigRef.current = sig
        markSettled()
        upsertActivity({
          id: GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
          phase: 'error',
          title: shellT(lang, 'shopifySyncFailedTitle'),
          subtitle: shopifySyncErrorSubtitle(syncingConn ?? failedConn, job.error_message, lang),
          href: '/dashboard/integrations/shopify?tab=settings',
        })
        toast.error(shellT(lang, 'shopifySyncToastFailed'))
        void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      }
      return
    }

    if (job?.status === 'succeeded') {
      const sig = `${job.id}:succeeded:${job.finished_at ?? ''}`
      if (settledSigRef.current !== sig) {
        settledSigRef.current = sig
        markSettled()
        upsertActivity({
          id: GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
          phase: 'success',
          title: shellT(lang, 'shopifySyncProgressTitle'),
          subtitle: buildShopifySuccessSubtitle(job, lang),
          href: '/dashboard/integrations/shopify?tab=settings',
        })
        toast.success(shellT(lang, 'shopifySyncToastSuccess'))
        void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
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
          id: GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
          phase: 'success',
          title: shellT(lang, 'shopifySyncProgressTitle'),
          subtitle: buildCompletedSyncSubtitle(completedConn, lang),
          href: '/dashboard/integrations/shopify?tab=settings',
        })
        toast.success(shellT(lang, 'shopifySyncToastSuccess'))
      }
      return
    }

    if (!syncingConn) {
      lastLoadingSubtitleRef.current = null
      if (failedConn) {
        const subtitle = shopifySyncErrorSubtitle(failedConn, null, lang)
        if (existing?.phase === 'error' && existing.subtitle === subtitle) return
        upsertActivity({
          id: GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
          phase: 'error',
          title: shellT(lang, 'shopifySyncFailedTitle'),
          subtitle,
          href: '/dashboard/integrations/shopify?tab=settings',
        })
        return
      }
      if (existing?.phase === 'loading') {
        removeActivity(GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID)
      }
      return
    }

    if (existing?.phase === 'error' || existing?.phase === 'success') {
      return
    }

    let subtitle: string
    if (!job || (job.status !== 'queued' && job.status !== 'running')) {
      subtitle = shellT(lang, 'shopifySyncProgressQueued')
    } else {
      subtitle = buildShopifyProgressSubtitle(job, lang)
    }
    if (lastLoadingSubtitleRef.current === subtitle) return
    lastLoadingSubtitleRef.current = subtitle
    upsertActivity({
      id: GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
      phase: 'loading',
      title: shellT(lang, 'shopifySyncProgressTitle'),
      subtitle,
      href: '/dashboard/integrations/shopify?tab=settings',
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
