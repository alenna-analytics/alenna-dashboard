import { ChevronsUpDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  planPillLabel,
  planSummaryLabel,
  upgradeTargetForPlan,
} from '@/lib/plan/plan-limit-ui'
import { PlanUpgradeCta } from '@/components/billing/plan-upgrade-cta'
import { shellT } from '@/lib/i18n/shell-strings'
import type { MeResponse } from '@/lib/types/me-types'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/shell/providers/language-provider'
import { sidebarNavIconClassName } from '@/shell/layout/sidebar-layout'
import { Badge } from '@/ui/badge'
import { AppIcon } from '@/ui/app-icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

const SETTINGS_PATH = '/dashboard/configuration/general'
const BILLING_PATH = '/dashboard/billing'

type HeaderWorkspaceSwitcherProps = {
  companyName: string
  me: MeResponse | null
}

const menuItemClassName =
  'gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary focus:bg-[var(--sidebar-accent)] focus:text-text-primary'

const menuIconClassName = cn(sidebarNavIconClassName, 'text-text-tertiary')

export function HeaderWorkspaceSwitcher({ companyName, me }: HeaderWorkspaceSwitcherProps) {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const showUpgrade = Boolean(me && upgradeTargetForPlan(me.plan))
  const pillLabel = me ? planPillLabel(me, lang) : null
  const planLine = me ? planSummaryLabel(me, lang) : null

  return (
    <DropdownMenu>
      <div className="flex h-8 min-w-0 max-w-[min(100%,14rem)] items-center gap-1.5">
        <span className="hidden min-w-0 flex-1 truncate text-subtitle font-semibold text-text-primary sm:block">
          {companyName}
        </span>
        {pillLabel ? (
          <Badge
            variant="outline"
            className="h-5 shrink-0 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide"
          >
            {pillLabel}
          </Badge>
        ) : null}
        <DropdownMenuTrigger
          aria-label={companyName}
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md outline-none',
            'transition-colors hover:bg-[var(--sidebar-accent)] focus-visible:ring-2 focus-visible:ring-ring/40',
          )}
        >
          <ChevronsUpDown className="size-3 text-text-tertiary" aria-hidden />
        </DropdownMenuTrigger>
      </div>

      <DropdownMenuContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-[15rem] rounded-lg border border-border-subtle bg-white p-1.5 shadow-md"
      >
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium text-text-primary">{companyName}</p>
          {planLine ? (
            <p className="mt-0.5 truncate text-xs text-text-tertiary">{planLine}</p>
          ) : null}
        </div>

        {showUpgrade && me ? (
          <>
            <div className="px-2 pb-1.5">
              <PlanUpgradeCta
                me={me}
                lang={lang}
                className="h-8 w-full gap-1.5 border-border-subtle bg-white font-normal text-text-primary hover:bg-[var(--sidebar-accent)]"
              />
            </div>
            <DropdownMenuSeparator className="my-1 bg-border-subtle" />
          </>
        ) : null}

        <DropdownMenuItem
          className={menuItemClassName}
          onClick={() => navigate(BILLING_PATH)}
        >
          <AppIcon name="billing" colorize className={menuIconClassName} />
          {shellT(lang, 'navBilling')}
        </DropdownMenuItem>

        <DropdownMenuItem
          className={menuItemClassName}
          onClick={() => navigate(SETTINGS_PATH)}
        >
          <AppIcon name="config" colorize className={menuIconClassName} />
          {shellT(lang, 'navSettings')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
