import { useMemo } from 'react'

import { useCogsBackfillJobWatcher } from '@/shell/hooks/use-cogs-backfill-job-watcher'
import { useCogsBulkBackfillBanner } from '@/shell/hooks/use-cogs-bulk-backfill-banner'
import { useGlobalActivity } from '@/shell/providers/global-activity-provider'

function CogsBackfillJobWatcher({ jobId }: { jobId: string }) {
  useCogsBackfillJobWatcher(jobId)
  return null
}

export function CogsBackfillActivityPollers() {
  useCogsBulkBackfillBanner()
  const { items } = useGlobalActivity()

  const loadingJobIds = useMemo(
    () =>
      items
        .filter((item) => item.id.startsWith('cogs-backfill:') && item.phase === 'loading')
        .map((item) => item.id.slice('cogs-backfill:'.length)),
    [items],
  )

  return (
    <>
      {loadingJobIds.map((jobId) => (
        <CogsBackfillJobWatcher key={jobId} jobId={jobId} />
      ))}
    </>
  )
}
