import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'

type AccountDeletionPendingBannerProps = {
  lang: string
  scheduledDateLabel: string
  cancelPending: boolean
  onCancel?: () => void
}

export function AccountDeletionPendingBanner({
  lang,
  scheduledDateLabel,
  cancelPending,
  onCancel,
}: AccountDeletionPendingBannerProps) {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-amber-950">
            {shellT(lang, 'settingsDeleteAccountPendingTitle')}
          </p>
          <p className="text-sm text-amber-900">
            {shellT(lang, 'settingsDeleteAccountPendingScheduled', { date: scheduledDateLabel })}
          </p>
          <p className="text-sm text-amber-800">
            {shellT(lang, 'settingsDeleteAccountPendingDataKept')}
          </p>
          <p className="text-xs text-amber-800">{shellT(lang, 'settingsDeleteAccountPendingEarly')}</p>
        </div>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            className="shrink-0 border-amber-300 bg-white"
            loading={cancelPending}
            onClick={onCancel}
          >
            {shellT(lang, 'settingsDeleteAccountPendingCancel')}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
