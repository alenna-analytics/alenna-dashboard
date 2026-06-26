import { useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
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

function pickSyncingShopify(
  connections: PlatformConnection[] | undefined,
): PlatformConnection | null {
  if (!connections?.length) return null
  for (const c of connections) {
    if (c.platform !== 'shopify' || c.status !== 'active' || c.connection_status !== 'active') {
      continue
    }
    const plan = c.sync_plan
    if (!plan) continue
    if (plan.current_job_id) return c
    if (plan.last_sync_status === 'syncing' && !isStaleSyncingPlan(c)) return c
  }
  return null
}

export function useShopifySyncBanner(
  connections: PlatformConnection[] | undefined,
): void {
  const { lang } = useLanguage()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()
  const { upsertActivity, removeActivity, items } = useGlobalActivity()

  const syncingConn = useMemo(() => pickSyncingShopify(connections), [connections])
  const jobId = syncingConn?.sync_plan?.current_job_id ?? null

  const jobQuery = useCatalogJobQuery(jobId, Boolean(jobId))

  const lastLoadingSubtitleRef = useRef<string | null>(null)

  useEffect(() => {
    if (!syncingConn) {
      lastLoadingSubtitleRef.current = null
      const existing = items.find((x) => x.id === GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID)
      if (existing?.phase === 'loading') {
        removeActivity(GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID)
      }
      return
    }
    const job = jobQuery.data
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
  }, [syncingConn, jobQuery.data, upsertActivity, removeActivity, items, lang])

  const settledSigRef = useRef<string | null>(null)

  useEffect(() => {
    const job = jobQuery.data
    if (!job) return
    if (job.status === 'queued' || job.status === 'running') {
      settledSigRef.current = null
      return
    }
    const sig = `${job.id}:${job.status}:${job.finished_at ?? ''}`
    if (settledSigRef.current === sig) return
    settledSigRef.current = sig
    lastLoadingSubtitleRef.current = null

    if (job.status === 'succeeded') {
      upsertActivity({
        id: GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
        phase: 'success',
        title: shellT(lang, 'shopifySyncProgressTitle'),
        subtitle: buildShopifySuccessSubtitle(job, lang),
        href: '/dashboard/integrations/shopify?tab=settings',
      })
      toast.success(shellT(lang, 'shopifySyncToastSuccess'))
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      return
    }

    if (job.status === 'failed') {
      upsertActivity({
        id: GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
        phase: 'error',
        title: shellT(lang, 'shopifySyncProgressTitle'),
        subtitle: job.error_message ?? shellT(lang, 'syncErrorLabel'),
        href: '/dashboard/integrations/shopify?tab=settings',
      })
      toast.error(shellT(lang, 'shopifySyncToastFailed'))
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
    }
  }, [jobQuery.data, upsertActivity, lang, queryClient, tenantId])
}
