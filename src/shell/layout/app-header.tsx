import { UserButton } from '@clerk/react'

import { AppBreadcrumbs } from '@/shell/layout/app-breadcrumbs'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { shellT } from '@/lib/i18n/shell-strings'
import { WORKSPACE_SHELL_COLUMN_CLASS } from '@/shell/layout/workspace-shell-column'

export function AppHeader({ className }: { className?: string }) {
  const { lang, toggleLang } = useLanguage()

  const ariaLang =
    lang === 'es' ? shellT(lang, 'ariaSwitchToEnglish') : shellT(lang, 'ariaSwitchToSpanish')

  return (
    <header className={cn('min-w-0 shrink-0 bg-card', className)}>
      <div
        className={cn(
          WORKSPACE_SHELL_COLUMN_CLASS,
          'flex min-h-10 items-center justify-between gap-3 py-2',
        )}
      >
        <div className="min-w-0 max-w-[min(100%,42rem)] flex-1">
          <AppBreadcrumbs className="min-w-0" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
