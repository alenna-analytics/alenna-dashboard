import { UserButton } from '@clerk/react'
import { Menu } from 'lucide-react'

import { AppBreadcrumbs } from '@/shell/layout/app-breadcrumbs'
import { CurrencyIndicator } from '@/shell/layout/currency-indicator'
import { CurrencyPicker } from '@/shell/layout/currency-picker'
import { SyncFreshnessHeaderPill } from '@/components/integrations/sync-freshness-header-pill'
import { GlobalActivityHeaderIndicator } from '@/shell/layout/global-activity-header-indicator'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { shellT } from '@/lib/i18n/shell-strings'
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
          WORKSPACE_SHELL_COLUMN_CLASS,
          'flex h-[var(--shell-chrome-header-height)] min-h-[var(--shell-chrome-header-height)] items-center justify-between gap-3 lg:hidden',
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 border-[var(--shell-structure-border)] bg-[var(--bg-base)]/30 text-text-secondary shadow-none hover:bg-[var(--bg-base)]/50 hover:text-text-primary"
          aria-label={shellT(lang, 'ariaOpenNavMenu')}
          onClick={onOpenMobileNav}
        >
          <Menu className="size-4" aria-hidden />
        </Button>
        <div className="flex shrink-0 items-center gap-2">
          <CurrencyIndicator />
          <UserButton />
        </div>
      </div>

      <div
        className={cn(
          WORKSPACE_SHELL_COLUMN_CLASS,
          'hidden h-[var(--shell-chrome-header-height)] min-h-[var(--shell-chrome-header-height)] items-center justify-between gap-3 lg:flex',
        )}
      >
        <div className="min-w-0 max-w-[min(100%,42rem)] flex-1">
          <AppBreadcrumbs className="min-w-0" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SyncFreshnessHeaderPill />
          <GlobalActivityHeaderIndicator />
          <CurrencyPicker />
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label={ariaLang}
            onClick={toggleLang}
            className="h-8 px-2 font-semibold text-text-secondary hover:text-text-primary"
          >
            {lang === 'es' ? 'EN' : 'ES'}
          </Button>
          <UserButton />
        </div>
      </div>
    </header>
  )
}
