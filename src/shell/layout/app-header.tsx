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
    <header className="flex min-w-0 shrink-0 items-center justify-between gap-4 px-5 pt-5 lg:px-8 lg:pt-7">
      <div className="header-crystal-pill min-w-0 max-w-[min(100%,28rem)] border-none bg-transparent px-0 py-0 shadow-none">
        <AppBreadcrumbs className="min-w-0" />
      </div>
      <div className="header-crystal-pill shrink-0 gap-1.5 py-1 pr-1.5 pl-2">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-label={ariaLang}
          onClick={toggleLang}
          className="h-8 px-3 font-semibold text-text-secondary hover:text-text-primary"
        >
          {lang === 'es' ? 'EN' : 'ES'}
        </Button>
        <UserButton />
      </div>
    </header>
  )
}
