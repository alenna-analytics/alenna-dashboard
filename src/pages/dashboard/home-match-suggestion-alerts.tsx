import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/ui/app-icon'

type HomeMatchSuggestionAlertsProps = {
  /** Active informational alerts (today only match_suggestion uses this severity). */
  matchCount: number
  onReview: () => void
  t: (key: ShellStringKey) => string
}

export function HomeMatchSuggestionAlerts({
  matchCount,
  onReview,
  t,
}: HomeMatchSuggestionAlertsProps) {
  if (matchCount <= 0) return null

  const message = t('homeMatchSuggestionBanner').replace('{count}', String(matchCount))

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-3 text-sm',
        'border-border-subtle bg-muted/40 text-foreground',
      )}
      role="status"
    >
      <div className="flex min-w-0 items-center gap-2">
        <AppIcon name="orders" colorize className="size-4 shrink-0" />
        <span className="min-w-0 leading-snug">{message}</span>
      </div>
      <button
        type="button"
        onClick={onReview}
        className="shrink-0 text-sm font-medium text-foreground underline underline-offset-2"
      >
        {t('homeMatchSuggestionBannerView')}
      </button>
    </div>
  )
}
