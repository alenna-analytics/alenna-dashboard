import { UserButton } from '@clerk/react'
import { MoonIcon, SunIcon } from 'lucide-react'

import { useLanguage } from '@/components/providers/language-provider'
import { useTheme } from '@/components/providers/theme-provider'
import { Button } from '@/components/ui/button'
import { shellT } from '@/lib/shell-strings'

export function AppHeader() {
  const { theme, toggleTheme } = useTheme()
  const { lang, toggleLang } = useLanguage()

  const ariaTheme =
    theme === 'dark'
      ? shellT(lang, 'ariaSwitchToLight')
      : shellT(lang, 'ariaSwitchToDark')
  const ariaLang =
    lang === 'es' ? shellT(lang, 'ariaSwitchToEnglish') : shellT(lang, 'ariaSwitchToSpanish')

  return (
    <header className="flex h-12 shrink-0 items-center justify-end gap-3 border-b border-border-subtle/80 bg-bg-surface px-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={ariaTheme}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <SunIcon className="size-4" />
          ) : (
            <MoonIcon className="size-4" />
          )}
        </Button>
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
