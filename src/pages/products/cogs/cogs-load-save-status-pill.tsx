import { Loader2, RotateCcw } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import { StatusPill } from '@/ui/status-pill'

export type CogsLoadAutosaveStatus = 'idle' | 'saving' | 'saved' | 'failed'

type CogsLoadSaveStatusPillProps = {
  status: CogsLoadAutosaveStatus
  t: (key: ShellStringKey) => string
  onRetry?: () => void
  retryPending?: boolean
}

export function CogsLoadSaveStatusPill({
  status,
  t,
  onRetry,
  retryPending = false,
}: CogsLoadSaveStatusPillProps) {
  if (status === 'idle') return null

  if (status === 'failed') {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <StatusPill variant="error">{t('productsCogsLoadAutosaveFailed')}</StatusPill>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={retryPending}
            onClick={onRetry}
          >
            <RotateCcw className="size-3.5 shrink-0" aria-hidden />
            {t('productsCogsLoadAutosaveRetry')}
          </Button>
        ) : null}
      </div>
    )
  }

  if (status === 'saving') {
    return (
      <StatusPill variant="neutral" className="gap-1.5">
        <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden />
        {t('productsCogsLoadSaving')}
      </StatusPill>
    )
  }

  return <StatusPill variant="success">{t('productsCogsLoadAutosaveSaved')}</StatusPill>
}
