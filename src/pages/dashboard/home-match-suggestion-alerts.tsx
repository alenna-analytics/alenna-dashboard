import { AppIcon } from '@/ui/app-icon'
import { buttonVariants } from '@/ui/button'
import { ContextAlertCard } from '@/ui/context-alert'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'

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

  const title = t('homeMatchSuggestionBanner').replace('{count}', String(matchCount))

  return (
    <ContextAlertCard
      title={title}
      icon={<AppIcon name="channels" className="size-4 text-black" />}
      tone="info"
      iconWrapClassName="bg-[var(--zara-base)] text-black"
      action={
        <button
          type="button"
          onClick={onReview}
          className={cn(buttonVariants({ variant: 'outline', size: 'xs' }), 'px-2.5')}
        >
          {t('homeMatchSuggestionBannerView')}
        </button>
      }
    />
  )
}
