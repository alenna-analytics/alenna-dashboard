import { UserButton } from '@clerk/react'
import { MenuIcon, MoonIcon, SunIcon } from 'lucide-react'

import { useCurrency } from '@/components/providers/currency-provider'
import { useLanguage } from '@/components/providers/language-provider'
import { useTheme } from '@/components/providers/theme-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AppHeaderProps = {
  onMenuClick?: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { lang, toggleLang } = useLanguage()
  const { displayCurrency, setDisplayCurrency } = useCurrency()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border-subtle bg-bg-surface px-4">
      <div className="flex items-center gap-2">
        {onMenuClick ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation menu"
            onClick={onMenuClick}
          >
            <MenuIcon className="size-4" />
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
          }
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <SunIcon className="size-4" />
          ) : (
            <MoonIcon className="size-4" />
          )}
        </Button>
        <div
          className="flex h-8 items-center rounded-[10px] border border-border-subtle bg-white/[0.03] p-0.5 dark:border-border-default dark:bg-white/[0.04]"
          role="group"
          aria-label="Display currency"
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
          aria-label={lang === 'es' ? 'Switch to English' : 'Switch to Spanish'}
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
