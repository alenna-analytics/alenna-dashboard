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
    <header className="flex h-14 min-w-0 shrink-0 items-center gap-4 bg-transparent px-6 backdrop-blur-xl lg:px-10">
      <AppBreadcrumbs className="min-w-0 flex-1" />
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={ariaLang}
          onClick={toggleLang}
          className="h-8"
        >
          {lang === 'es' ? 'EN' : 'ES'}
        </Button>
        <UserButton />
      </div>
    </header>
  )
}
