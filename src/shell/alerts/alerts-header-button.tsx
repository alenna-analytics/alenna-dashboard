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
        <span className="pointer-events-none absolute top-0 right-0 z-10 flex min-w-[1rem] translate-x-1/3 -translate-y-1/3 items-center justify-center rounded-full bg-[var(--stock-alert-critical)] px-1 py-px text-[0.625rem] font-semibold leading-none text-white">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </button>
  )
}
