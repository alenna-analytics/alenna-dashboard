import { UserButton } from '@clerk/react'
import { MenuIcon, MoonIcon, SunIcon } from 'lucide-react'

import { useLanguage } from '@/components/providers/language-provider'
import { useTheme } from '@/components/providers/theme-provider'
import { Button } from '@/components/ui/button'

type AppHeaderProps = {
  onMenuClick?: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { lang, toggleLang } = useLanguage()

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
