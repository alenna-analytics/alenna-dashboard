import { AppIcon } from '@/ui/app-icon'
import { shellT } from '@/lib/i18n/shell-strings'
import { useAlertsSummaryQuery } from '@/pages/dashboard/use-alerts-queries'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'

import { useAlertsSheet } from './alerts-sheet-context'
import { activeAlertsDisplayCount } from './alert-display'

export function AlertsHeaderButton({ className }: { className?: string }) {
  const { lang } = useLanguage()
  const { openSheet } = useAlertsSheet()
  const { data } = useAlertsSummaryQuery()
  const count = activeAlertsDisplayCount(data?.critical_count, data?.low_count)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn('relative size-8 shrink-0 text-text-secondary hover:text-text-primary', className)}
      aria-label={shellT(lang, 'shellAlertsOpenAria')}
      onClick={openSheet}
    >
      <AppIcon name="notifications" className="size-4" />
      {count > 0 ? (
        <span className="pointer-events-none absolute top-0.5 right-0.5 flex min-w-[1rem] translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-[var(--stock-alert-critical)] px-1 py-px text-[10px] font-semibold leading-none text-white">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Button>
  )
}
