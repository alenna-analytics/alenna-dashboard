import { GitMerge } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { buttonVariants } from '@/ui/button'
import { ContextAlertCard } from '@/ui/context-alert'
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
      icon={GitMerge}
      tone="info"
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
