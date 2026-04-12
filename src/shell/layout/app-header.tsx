import { UserButton } from '@clerk/react'

import { AppBreadcrumbs } from '@/shell/layout/app-breadcrumbs'
import { useLanguage } from '@/shell/providers/language-provider'
import { Button } from '@/ui/button'
import { shellT } from '@/lib/i18n/shell-strings'

export function AppHeader() {
  const { lang, toggleLang } = useLanguage()

  const ariaLang =
    lang === 'es' ? shellT(lang, 'ariaSwitchToEnglish') : shellT(lang, 'ariaSwitchToSpanish')

  return (
    <header className="flex h-14 min-w-0 shrink-0 items-center justify-between gap-4 bg-transparent px-6 lg:px-10">
      <div className="header-crystal-pill min-w-0 max-w-[min(100%,32rem)]">
        <AppBreadcrumbs className="min-w-0" />
      </div>
      <div className="header-crystal-pill shrink-0 gap-1.5 py-1 pr-1 pl-2">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-label={ariaLang}
          onClick={toggleLang}
          className="h-7 font-semibold text-text-secondary hover:text-text-primary"
        >
          {lang === 'es' ? 'EN' : 'ES'}
        </Button>
        <UserButton />
      </div>
    </header>
  )
}
