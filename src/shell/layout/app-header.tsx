import type { ReactNode } from 'react'
import { UserButton } from '@clerk/react'
import { Menu } from 'lucide-react'

import alennaIconBlack from '@/assets/alenna/alenna-icon-black.svg'
import { AlertsHeaderButton } from '@/shell/alerts/alerts-header-button'
import { CurrencyPicker } from '@/shell/layout/currency-picker'
import { HeaderConnectionsMenu } from '@/shell/layout/header-connections-menu'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { shellChromeHeaderRowClassName } from '@/shell/layout/sidebar-layout'

const shellHeaderRowPaddingClassName = 'w-full px-4 lg:px-5'

type AppHeaderProps = {
  className?: string
  companyName: string
  onOpenMobileNav?: () => void
}

function HeaderChromeButton({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex size-8 shrink-0 items-center justify-center overflow-visible rounded',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function AppHeader({ className, companyName, onOpenMobileNav }: AppHeaderProps) {
  const { lang } = useLanguage()

  return (
    <header className={cn('min-w-0 shrink-0 bg-white', className)}>
      <div
        className={cn(
          shellChromeHeaderRowClassName,
          shellHeaderRowPaddingClassName,
          'justify-between gap-3',
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 lg:hidden"
            aria-label={shellT(lang, 'ariaOpenNavMenu')}
            onClick={onOpenMobileNav}
          >
            <Menu className="size-4" aria-hidden />
          </Button>
          <img
            src={alennaIconBlack}
            alt=""
            className="size-6 shrink-0 object-contain"
            draggable={false}
          />
          <p className="truncate text-subtitle font-semibold text-text-primary">{companyName}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 overflow-visible sm:gap-2">
          <HeaderConnectionsMenu />
          <CurrencyPicker className="hidden h-8 sm:inline-flex" />
          <HeaderChromeButton className="bg-[var(--platinum-blonde-300)]">
            <AlertsHeaderButton />
          </HeaderChromeButton>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'size-8 rounded-full',
                userButtonPopoverCard: 'shadow-lg',
              },
            }}
          />
        </div>
      </div>
    </header>
  )
}
