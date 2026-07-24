import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import {
  formatAmazonSyncUserError,
  amazonSyncFailedTitle,
} from '@/lib/integrations/amazon-sync-user-error'
import { shouldShowAmazonSyncSuccessFromConnector } from '@/lib/integrations/amazon-sync-banner-logic'
import { isPlatformSyncUserCancelled } from '@/lib/integrations/platform-sync-user-error'
import { shellT } from '@/lib/i18n/shell-strings'
import { isStaleSyncingPlan } from '@/lib/integrations/sync-freshness'
import type { PlatformConnection } from '@/lib/types/connectors'
import { invalidateAlertsQueries } from '@/pages/dashboard/use-alerts-queries'
import { useCatalogJobQuery } from '@/pages/products/use-catalog-queries'
import {
  GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { isTerminalDismissed } from '@/shell/providers/global-activity-dismissals'
import { useLanguage } from '@/shell/providers/language-provider'

const BANNER_ERROR_SUBTITLE_MAX = 160

function isActiveAmazonConnection(conn: PlatformConnection): boolean {
  return (
    conn.platform === 'amazon' &&
    conn.status === 'active' &&
    conn.connection_status === 'active'
  )
}

function truncateBannerError(message: string): string {
  const oneLine = message.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= BANNER_ERROR_SUBTITLE_MAX) return oneLine
  return `${oneLine.slice(0, BANNER_ERROR_SUBTITLE_MAX - 1)}…`
}

function pickSyncingAmazon(
  connections: PlatformConnection[] | undefined,
): PlatformConnection | null {
  if (!connections?.length) return null
  for (const c of connections) {
    if (!isActiveAmazonConnection(c)) continue
    const plan = c.sync_plan
    if (!plan) continue
    if (plan.current_job_id) return c
    const status = plan.last_sync_status
    if (status === 'failed' || status === 'synced' || status === 'partial') continue
    if (status === 'syncing' && !isStaleSyncingPlan(c)) return c
  }
  return null
}

function pickFailedAmazon(
  connections: PlatformConnection[] | undefined,
): PlatformConnection | null {
  if (!connections?.length) return null
  for (const c of connections) {
    if (!isActiveAmazonConnection(c)) continue
    if (c.sync_plan?.last_sync_status === 'failed') return c
  }
  return null
}

function pickCompletedAmazon(
  connections: PlatformConnection[] | undefined,
): PlatformConnection | null {
  if (!connections?.length) return null
  for (const c of connections) {
    if (!isActiveAmazonConnection(c)) continue
    const status = c.sync_plan?.last_sync_status
    if (status === 'synced' || status === 'partial') return c
  }
  return null
}

function amazonSyncErrorSubtitle(
  conn: PlatformConnection | null | undefined,
  jobError: string | null | undefined,
  jobErrorCode: string | null | undefined,
  lang: Parameters<typeof formatAmazonSyncUserError>[1],
): string {
  const raw = formatAmazonSyncUserError(jobError ?? conn?.last_error ?? null, lang, jobErrorCode)
  return truncateBannerError(raw)
}

function buildCompletedSyncSubtitle(
  conn: PlatformConnection,
  lang: Parameters<typeof formatAmazonSyncUserError>[1],
): string {
  const count = conn.sync_plan?.last_sync_records_count
  if (count != null && count > 0) {
    return `${count.toLocaleString()} ${shellT(lang, 'reportsOrders')}`
  }
  return shellT(lang, 'amazonSyncToastSuccess')
}

function upsertFailedBanner(args: {
  conn: PlatformConnection | null
  jobError?: string | null
  jobErrorCode?: string | null
  dismissKey: string
  lang: Parameters<typeof formatAmazonSyncUserError>[1]
  tenantId: string | null | undefined
  upsertActivity: ReturnType<typeof useGlobalActivity>['upsertActivity']
}): void {
  const { conn, jobError, jobErrorCode, dismissKey, lang, tenantId, upsertActivity } = args
  if (isTerminalDismissed(tenantId, GLOBAL_ACTIVITY_AMAZON_SYNC_ID, dismissKey)) return
  upsertActivity({
    id: GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
    phase: 'error',
    title: amazonSyncFailedTitle(lang, jobErrorCode, jobError),
    subtitle: amazonSyncErrorSubtitle(conn, jobError, jobErrorCode, lang),
    href: '/dashboard/integrations/amazon?tab=settings',
    dismissKey,
  })
}

export function useAmazonSyncBanner(connections: PlatformConnection[] | undefined): void {
  const { lang } = useLanguage()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()
  const { upsertActivity, removeActivity, clearTerminalActivityDismissal, items } =
    useGlobalActivity()

  const syncingConn = useMemo(() => pickSyncingAmazon(connections), [connections])
  const failedConn = useMemo(() => pickFailedAmazon(connections), [connections])
  const completedConn = useMemo(() => pickCompletedAmazon(connections), [connections])
  const serverJobId = syncingConn?.sync_plan?.current_job_id ?? null

  const existingAmazonActivity = items.find((x) => x.id === GLOBAL_ACTIVITY_AMAZON_SYNC_ID)
  const activityJobId = existingAmazonActivity?.jobId ?? null
  const [lastSeenJobId, setLastSeenJobId] = useState<string | null>(null)
  const [prevServerJobId, setPrevServerJobId] = useState<string | null>(serverJobId)
  const [prevActivityJobId, setPrevActivityJobId] = useState<string | null>(activityJobId)

  if (serverJobId !== prevServerJobId) {
    setPrevServerJobId(serverJobId)
    if (serverJobId) setLastSeenJobId(serverJobId)
  }

  if (activityJobId !== prevActivityJobId) {
    setPrevActivityJobId(activityJobId)
    if (activityJobId) setLastSeenJobId(activityJobId)
  }

  if (
    !serverJobId &&
    existingAmazonActivity?.phase !== 'loading' &&
    lastSeenJobId !== null
  ) {
    setLastSeenJobId(null)
  }

  const pollJobId =
    serverJobId ??
    (existingAmazonActivity?.phase === 'loading'
      ? (activityJobId ?? lastSeenJobId)
      : null)

  const shouldPollJob = Boolean(pollJobId)

  const jobQuery = useCatalogJobQuery(pollJobId, shouldPollJob)
  const jobFetched = !shouldPollJob || jobQuery.isFetched

  const lastLoadingSubtitleRef = useRef<string | null>(null)
  const settledSigRef = useRef<string | null>(null)
  const syncStartCompletedAtRef = useRef<string | null>(null)
  const prevPollJobIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (pollJobId && !prevPollJobIdRef.current) {
      syncStartCompletedAtRef.current =
        completedConn?.sync_plan?.last_sync_completed_at ?? null
    }
    if (!pollJobId) {
      syncStartCompletedAtRef.current = null
    }
    prevPollJobIdRef.current = pollJobId
  }, [pollJobId, completedConn?.sync_plan?.last_sync_completed_at])

  useEffect(() => {
    const job = jobQuery.data
    const existing = items.find((x) => x.id === GLOBAL_ACTIVITY_AMAZON_SYNC_ID)

    const markSettled = () => {
      lastLoadingSubtitleRef.current = null
    }

    if (job?.status === 'failed') {
      const sig = `${job.id}:failed:${job.finished_at ?? ''}`
      if (settledSigRef.current !== sig) {
        settledSigRef.current = sig
        markSettled()
        const cancelled = isPlatformSyncUserCancelled(job.error_code, job.error_message)
        upsertFailedBanner({
          conn: syncingConn ?? failedConn,
          jobError: job.error_message,
          jobErrorCode: job.error_code,
          dismissKey: sig,
          lang,
          tenantId,
          upsertActivity,
        })
        if (!cancelled && !isTerminalDismissed(tenantId, GLOBAL_ACTIVITY_AMAZON_SYNC_ID, sig)) {
          toast.error(shellT(lang, 'amazonSyncToastFailed'))
        }
        void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      }
      return
    }

    if (job?.status === 'succeeded') {
      const sig = `${job.id}:succeeded:${job.finished_at ?? ''}`
      if (settledSigRef.current !== sig) {
        settledSigRef.current = sig
        markSettled()
        if (isTerminalDismissed(tenantId, GLOBAL_ACTIVITY_AMAZON_SYNC_ID, sig)) return
        const records = job.records_synced ?? 0
        const subtitle =
          records > 0
            ? `${records.toLocaleString()} ${shellT(lang, 'reportsOrders')}`
            : shellT(lang, 'amazonSyncToastSuccess')
        upsertActivity({
          id: GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
          phase: 'success',
          title: shellT(lang, 'amazonSyncProgressTitle'),
          subtitle,
          href: '/dashboard/integrations/amazon?tab=settings',
          dismissKey: sig,
        })
        toast.success(shellT(lang, 'amazonSyncToastSuccess'))
        void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
        invalidateAlertsQueries(queryClient, tenantId)
      }
      return
    }

    if (job?.status === 'queued' || job?.status === 'running') {
      settledSigRef.current = null
      clearTerminalActivityDismissal(GLOBAL_ACTIVITY_AMAZON_SYNC_ID)
      const processed = job.progress?.orders_processed
      const phase = job.progress?.phase
      let subtitle: string
      if (phase === 'catalog') {
        subtitle = shellT(lang, 'platformSyncProgressCatalog')
      } else if (typeof processed === 'number' && processed > 0) {
        subtitle = `${processed.toLocaleString()} ${shellT(lang, 'platformSyncProgressOrders')}`
      } else if (job.status === 'queued') {
        subtitle = shellT(lang, 'amazonSyncProgressQueued')
      } else {
        subtitle = shellT(lang, 'syncRunning')
      }
      if (lastLoadingSubtitleRef.current === subtitle && existing?.phase === 'loading') return
      lastLoadingSubtitleRef.current = subtitle
      upsertActivity({
        id: GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
        phase: 'loading',
        title: shellT(lang, 'amazonSyncProgressTitle'),
        subtitle,
        href: '/dashboard/integrations/amazon?tab=settings',
        jobId: pollJobId ?? undefined,
      })
      return
    }

    // No confirmed active job — never keep a phantom "En cola" banner.
    if (existing?.phase === 'loading' && jobFetched) {
      markSettled()
      if (failedConn) {
        const dismissKey = `failed:${failedConn.id}:${failedConn.sync_plan?.last_sync_completed_at ?? ''}:${failedConn.last_error ?? ''}`
        upsertFailedBanner({
          conn: failedConn,
          dismissKey,
          lang,
          tenantId,
          upsertActivity,
        })
        return
      }
      if (
        completedConn &&
        shouldShowAmazonSyncSuccessFromConnector({
          baselineCompletedAt: syncStartCompletedAtRef.current,
          currentCompletedAt: completedConn.sync_plan?.last_sync_completed_at ?? null,
        })
      ) {
        const sig = `completed:${completedConn.id}:${completedConn.sync_plan?.last_sync_completed_at ?? ''}`
        if (settledSigRef.current !== sig) {
          settledSigRef.current = sig
          if (!isTerminalDismissed(tenantId, GLOBAL_ACTIVITY_AMAZON_SYNC_ID, sig)) {
            upsertActivity({
              id: GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
              phase: 'success',
              title: shellT(lang, 'amazonSyncProgressTitle'),
              subtitle: buildCompletedSyncSubtitle(completedConn, lang),
              href: '/dashboard/integrations/amazon?tab=settings',
              dismissKey: sig,
            })
          }
        }
        return
      }
      removeActivity(GLOBAL_ACTIVITY_AMAZON_SYNC_ID)
      return
    }

    if (failedConn && existing?.phase !== 'loading') {
      const subtitle = amazonSyncErrorSubtitle(failedConn, null, null, lang)
      const dismissKey = `failed:${failedConn.id}:${failedConn.sync_plan?.last_sync_completed_at ?? ''}:${failedConn.last_error ?? ''}`
      if (isTerminalDismissed(tenantId, GLOBAL_ACTIVITY_AMAZON_SYNC_ID, dismissKey)) return
      if (existing?.phase === 'error' && existing.subtitle === subtitle) return
      upsertActivity({
        id: GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
        phase: 'error',
        title: shellT(lang, 'amazonSyncFailedTitle'),
        subtitle,
        href: '/dashboard/integrations/amazon?tab=settings',
        dismissKey,
      })
    }
  }, [
    syncingConn,
    failedConn,
    completedConn,
    jobQuery.data,
    jobFetched,
    upsertActivity,
    removeActivity,
    clearTerminalActivityDismissal,
    items,
    lang,
    queryClient,
    tenantId,
    pollJobId,
  ])
}
