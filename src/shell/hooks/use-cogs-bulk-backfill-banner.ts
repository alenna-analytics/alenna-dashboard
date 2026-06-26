import { useAuth } from '@clerk/react'
import { useEffect, useMemo, useRef } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
import type { CatalogJobApi } from '@/lib/types/catalog'
import {
  GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { useLanguage } from '@/shell/providers/language-provider'

function replaceCount(template: string, count: number): string {
  return template.replace('{count}', String(count))
}

function replaceProgress(template: string, done: number, total: number): string {
  return template.replace('{done}', String(done)).replace('{total}', String(total))
}

export function useCogsBulkBackfillBanner(): void {
  const { lang } = useLanguage()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()
  const {
    cogsBulkBackfillJobIds,
    upsertActivity,
    patchActivity,
    removeCogsBulkBackfillJob,
    items,
  } = useGlobalActivity()

  const settledSigRef = useRef<string | null>(null)

  const jobQueries = useQueries({
    queries: cogsBulkBackfillJobIds.map((jobId) => ({
      queryKey: ['catalog', 'job', tenantId, jobId],
      enabled: Boolean(tenantId && jobId),
      refetchInterval: (query: { state: { data?: CatalogJobApi } }) => {
        const status = query.state.data?.status
        return status === 'queued' || status === 'running' ? 2000 : false
      },
      queryFn: async (): Promise<CatalogJobApi> => {
        const res = await apiFetch(
          `/catalog/jobs/${jobId}`,
          (a) => getToken(a),
          {},
          tenantId,
        )
        if (!res.ok) throw new Error(await res.text())
        return (await res.json()) as CatalogJobApi
      },
    })),
  })

  const jobs = useMemo(
    () => jobQueries.map((q) => q.data).filter((j): j is CatalogJobApi => Boolean(j)),
    [jobQueries],
  )

  const hasBulkBanner = items.some((item) => item.id === GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID)

  useEffect(() => {
    if (cogsBulkBackfillJobIds.length === 0 && !hasBulkBanner) return

    const total = cogsBulkBackfillJobIds.length
    if (total === 0) return

    const queued = jobs.filter((j) => j.status === 'queued').length
    const running = jobs.filter((j) => j.status === 'running').length
    const succeeded = jobs.filter((j) => j.status === 'succeeded').length
    const failed = jobs.filter((j) => j.status === 'failed').length
    const active = queued + running
    const settled = succeeded + failed

    if (active > 0 || settled < total) {
      settledSigRef.current = null
      const subtitle =
        active > 0
          ? replaceProgress(shellT(lang, 'productsBulkCogsBackfillBannerProgress'), settled, total)
          : shellT(lang, 'productsJobQueued')
      upsertActivity({
        id: GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID,
        phase: 'loading',
        title: shellT(lang, 'globalActivityCogsBackfillTitle'),
        subtitle,
        href: '/dashboard/products',
      })
      return
    }

    const sig = jobs.map((j) => `${j.id}:${j.status}:${j.finished_at ?? ''}`).join('|')
    if (settledSigRef.current === sig) return
    settledSigRef.current = sig

    for (const jobId of cogsBulkBackfillJobIds) {
      removeCogsBulkBackfillJob(jobId)
    }

    if (failed > 0) {
      patchActivity(GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID, {
        phase: 'error',
        subtitle:
          failed === total
            ? shellT(lang, 'productsJobFailed')
            : replaceCount(shellT(lang, 'productsBulkCogsBackfillBannerFailed'), failed),
      })
      return
    }

    patchActivity(GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID, {
      phase: 'success',
      subtitle: shellT(lang, 'productsBulkCogsBackfillBannerDone'),
    })
    void queryClient.invalidateQueries({ queryKey: ['catalog', 'product', tenantId] })
    void queryClient.invalidateQueries({ queryKey: ['catalog', 'products', tenantId] })
  }, [
    cogsBulkBackfillJobIds,
    hasBulkBanner,
    jobs,
    lang,
    patchActivity,
    queryClient,
    removeCogsBulkBackfillJob,
    tenantId,
    upsertActivity,
  ])
}
