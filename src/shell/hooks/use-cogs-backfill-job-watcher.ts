import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import { useCatalogJobQuery } from '@/pages/products/use-catalog-queries'
import {
  cogsBackfillActivityId,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { useLanguage } from '@/shell/providers/language-provider'

export function useCogsBackfillJobWatcher(jobId: string): void {
  const { lang } = useLanguage()
  const { tenantId } = useCurrentTenant()
  const qc = useQueryClient()
  const { patchActivity } = useGlobalActivity()
  const jobQuery = useCatalogJobQuery(jobId, Boolean(jobId))
  const settledSigRef = useRef<string | null>(null)

  useEffect(() => {
    const job = jobQuery.data
    if (!job || job.id !== jobId) return

    const gid = cogsBackfillActivityId(jobId)

    if (job.status === 'queued') {
      settledSigRef.current = null
      patchActivity(gid, { phase: 'loading', subtitle: shellT(lang, 'productsJobQueued') })
      return
    }
    if (job.status === 'running') {
      settledSigRef.current = null
      patchActivity(gid, { phase: 'loading', subtitle: shellT(lang, 'productsJobRunning') })
      return
    }

    const sig = `${job.id}:${job.status}:${job.finished_at ?? ''}`
    if (settledSigRef.current === sig) return
    settledSigRef.current = sig

    if (job.status === 'succeeded') {
      patchActivity(gid, { phase: 'success', subtitle: shellT(lang, 'productsJobSucceeded') })
      void qc.invalidateQueries({ queryKey: ['catalog', 'product', tenantId] })
      void qc.invalidateQueries({ queryKey: ['catalog', 'products', tenantId] })
      return
    }

    if (job.status === 'failed') {
      patchActivity(gid, {
        phase: 'error',
        subtitle: job.error_message ?? shellT(lang, 'productsJobFailed'),
      })
    }
  }, [jobId, jobQuery.data, lang, patchActivity, qc, tenantId])
}
