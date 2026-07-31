import { PanelLeft } from 'lucide-react'

import type { SidebarControlMode } from '@/lib/shell/sidebar-control-prefs'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

type SidebarControlMenuProps = {
  mode: SidebarControlMode
  onModeChange: (mode: SidebarControlMode) => void
  collapsed: boolean
}

const modeOptions: SidebarControlMode[] = ['expanded', 'collapsed', 'expand_on_hover']

const modeLabelKey: Record<
  SidebarControlMode,
  'sidebarControlExpanded' | 'sidebarControlCollapsed' | 'sidebarControlExpandOnHover'
> = {
  expanded: 'sidebarControlExpanded',
  collapsed: 'sidebarControlCollapsed',
  expand_on_hover: 'sidebarControlExpandOnHover',
}

const menuItemClassName =
  'rounded-md px-2 py-1.5 text-sm text-text-primary focus:bg-[var(--sidebar-accent)] focus:text-text-primary'

export function SidebarControlMenu({ mode, onModeChange, collapsed }: SidebarControlMenuProps) {
  const { lang } = useLanguage()
  const t = (key: Parameters<typeof shellT>[1]) => shellT(lang, key)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('ariaSidebarControl')}
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-md outline-none',
          'text-text-tertiary transition-colors hover:bg-[var(--sidebar-accent)] hover:text-text-primary',
          'focus-visible:ring-2 focus-visible:ring-ring/40',
          collapsed && 'mx-auto',
        )}
      >
        <PanelLeft className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align={collapsed ? 'center' : 'start'}
        sideOffset={6}
        className="w-[13.5rem] rounded-lg border border-border-subtle bg-white p-1.5 shadow-md"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1 text-xs font-medium text-text-tertiary">
            {t('sidebarControlLabel')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1 bg-border-subtle" />
          {modeOptions.map((option) => {
            const selected = mode === option
            return (
              <DropdownMenuItem
                key={option}
                className={menuItemClassName}
                onClick={() => onModeChange(option)}
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {selected ? (
                    <span className="size-1.5 rounded-full bg-text-primary" aria-hidden />
                  ) : null}
                </span>
                {t(modeLabelKey[option])}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
