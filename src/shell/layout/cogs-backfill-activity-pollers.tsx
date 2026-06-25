import { useMemo } from 'react'

import { useGlobalActivity } from '@/shell/providers/global-activity-provider'
import { useCogsBackfillJobWatcher } from '@/shell/hooks/use-cogs-backfill-job-watcher'

function CogsBackfillJobWatcher({ jobId }: { jobId: string }) {
  useCogsBackfillJobWatcher(jobId)
  return null
}

export function CogsBackfillActivityPollers() {
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
