import { UserButton } from '@clerk/react'
import { Menu } from 'lucide-react'

import { AlertsHeaderButton } from '@/shell/alerts/alerts-header-button'
import { AppBreadcrumbs } from '@/shell/layout/app-breadcrumbs'
import { CurrencyIndicator } from '@/shell/layout/currency-indicator'
import { CurrencyPicker } from '@/shell/layout/currency-picker'
import { SyncFreshnessHeaderPill } from '@/components/integrations/sync-freshness-header-pill'
import { GlobalActivityHeaderIndicator } from '@/shell/layout/global-activity-header-indicator'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { chromeIconButtonClassName, chromeTextButtonClassName } from '@/ui/surface'
import { shellT } from '@/lib/i18n/shell-strings'
import { shellChromeHeaderRowClassName } from '@/shell/layout/sidebar-layout'
import { WORKSPACE_SHELL_COLUMN_CLASS } from '@/shell/layout/workspace-shell-column'

type AppHeaderProps = {
  className?: string
  onOpenMobileNav?: () => void
}

export function AppHeader({ className, onOpenMobileNav }: AppHeaderProps) {
  const { lang, toggleLang } = useLanguage()

  const ariaLang =
    lang === 'es' ? shellT(lang, 'ariaSwitchToEnglish') : shellT(lang, 'ariaSwitchToSpanish')

  return (
    <header className={cn('min-w-0 shrink-0 bg-card', className)}>
      <div
        className={cn(
          shellChromeHeaderRowClassName,
          WORKSPACE_SHELL_COLUMN_CLASS,
          'justify-between gap-3 lg:hidden',
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(chromeIconButtonClassName, 'lg:hidden')}
          aria-label={shellT(lang, 'ariaOpenNavMenu')}
          onClick={onOpenMobileNav}
        >
          <Menu className="size-4" aria-hidden />
        </Button>
        <div className="flex shrink-0 items-center gap-2">
          <CurrencyIndicator />
          <AlertsHeaderButton />
          <UserButton />
        </div>
      </div>

      <div
        className={cn(
          shellChromeHeaderRowClassName,
          WORKSPACE_SHELL_COLUMN_CLASS,
          'hidden justify-between gap-3 lg:flex',
        )}
      >
        <div className="min-w-0 max-w-[min(100%,42rem)] flex-1">
          <AppBreadcrumbs className="min-w-0" />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <SyncFreshnessHeaderPill />
          <GlobalActivityHeaderIndicator />
          <CurrencyPicker />
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label={ariaLang}
            onClick={toggleLang}
            className={chromeTextButtonClassName}
          >
            {lang === 'es' ? 'EN' : 'ES'}
          </Button>
          <AlertsHeaderButton />
          <UserButton />
        </div>
      </div>
    </header>
  )
}
