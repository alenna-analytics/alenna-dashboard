import type { ReactNode } from 'react'
import { Menu } from 'lucide-react'

import alennaIconBlack from '@/assets/alenna/alenna-icon-black.svg'
import { AlertsHeaderButton } from '@/shell/alerts/alerts-header-button'
import { CurrencyPicker } from '@/shell/layout/currency-picker'
import { HeaderConnectionsMenu } from '@/shell/layout/header-connections-menu'
import { HeaderUserButton } from '@/shell/layout/header-user-button'
import { HeaderWorkspaceSwitcher } from '@/shell/layout/header-workspace-switcher'
import { shellT } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import type { MeResponse } from '@/lib/types/me-types'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { shellChromeHeaderRowClassName } from '@/shell/layout/sidebar-layout'

const shellHeaderRowPaddingClassName = 'w-full px-4 lg:px-5'

type AppHeaderProps = {
  className?: string
  onOpenMobileNav?: () => void
  companyName?: string
  me?: MeResponse | null
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

export function AppHeader({
  className,
  onOpenMobileNav,
  companyName = '',
  me = null,
}: AppHeaderProps) {
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
          {companyName ? (
            <HeaderWorkspaceSwitcher companyName={companyName} me={me} />
          ) : null}
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 overflow-visible sm:gap-2">
          <HeaderConnectionsMenu />
          <CurrencyPicker className="hidden h-8 sm:inline-flex" />
          {can(me, 'alerts.view') ? (
          <HeaderChromeButton className="bg-[var(--chrome-muted)]">
            <AlertsHeaderButton />
          </HeaderChromeButton>
          ) : null}
          <HeaderUserButton me={me} />
        </div>
      </div>
    </header>
  )
}
