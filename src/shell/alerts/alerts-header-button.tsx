import { AppIcon } from '@/ui/app-icon'
import { shellT } from '@/lib/i18n/shell-strings'
import { useAlertsSummaryQuery } from '@/pages/dashboard/use-alerts-queries'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'

import { useAlertsSheet } from './alerts-sheet-context'
import { activeAlertsDisplayCount } from './alert-display'

export function AlertsHeaderButton({ className }: { className?: string }) {
  const { lang } = useLanguage()
  const { openSheet } = useAlertsSheet()
  const { data } = useAlertsSummaryQuery()
  const count = activeAlertsDisplayCount(data?.critical_count, data?.low_count)

  return (
    <button
      type="button"
      className={cn(
        'relative flex size-8 items-center justify-center rounded text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
        className,
      )}
      aria-label={shellT(lang, 'shellAlertsOpenAria')}
      onClick={openSheet}
    >
      <AppIcon name="notifications" tone="muted" className="size-4" />
      {count > 0 ? (
        <span
          className={cn(
            'pointer-events-none absolute -top-px -right-px z-10 flex size-3.5 min-h-3.5 min-w-3.5 max-w-3.5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--stock-alert-critical)] p-0 text-white tabular-nums',
            count >= 100 ? 'text-[7px] leading-none font-semibold' : 'text-[8px] leading-none font-semibold',
          )}
        >
          {count >= 100 ? '99+' : count}
        </span>
      ) : null}
    </button>
  )
}
