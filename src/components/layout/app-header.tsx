import { UserButton } from '@clerk/react'
import { MenuIcon, MoonIcon, SunIcon } from 'lucide-react'

import { useCurrency } from '@/components/providers/currency-provider'
import { useLanguage } from '@/components/providers/language-provider'
import { usePageChrome } from '@/components/providers/page-chrome-context'
import { useTheme } from '@/components/providers/theme-provider'
import { Button } from '@/components/ui/button'
import { shellT } from '@/lib/shell-strings'
import { cn } from '@/lib/utils'

type AppHeaderProps = {
  onMenuClick?: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { lang, toggleLang } = useLanguage()
  const { displayCurrency, setDisplayCurrency } = useCurrency()
  const { title } = usePageChrome()

  const ariaTheme =
    theme === 'dark'
      ? shellT(lang, 'ariaSwitchToLight')
      : shellT(lang, 'ariaSwitchToDark')
  const ariaLang =
    lang === 'es' ? shellT(lang, 'ariaSwitchToEnglish') : shellT(lang, 'ariaSwitchToSpanish')

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-subtle/80 bg-bg-surface px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onMenuClick ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label={shellT(lang, 'ariaOpenNavMenu')}
            onClick={onMenuClick}
          >
            <MenuIcon className="size-4" />
          </Button>
        ) : null}
        {title ? (
          <div className="flex min-w-0 flex-1 items-center">
            <h1 className="truncate text-[15px] font-medium leading-tight tracking-tight text-text-primary">
              {title}
            </h1>
          </div>
        ) : (
          <div className="flex-1" aria-hidden />
        )}
      </div>
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
        <div
          className="flex h-8 items-center rounded-[12px] border border-border-subtle bg-white/[0.03] p-0.5 dark:border-border-default dark:bg-white/[0.04]"
          role="group"
          aria-label={shellT(lang, 'ariaDisplayCurrency')}
        >
          {(['MXN', 'USD'] as const).map((c) => (
            <Button
              key={c}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 min-w-[2.5rem] px-2 text-[11px] font-medium',
                displayCurrency === c
                  ? 'bg-white/[0.12] text-text-primary dark:bg-white/[0.1]'
                  : 'text-text-tertiary hover:text-text-secondary'
              )}
              onClick={() => {
                setDisplayCurrency(c)
              }}
            >
              {c}
            </Button>
          ))}
        </div>
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
