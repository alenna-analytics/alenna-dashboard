import { shellT } from '@/lib/i18n/shell-strings'
import type { MeResponse } from '@/lib/types/me-types'
import { trialDaysRemaining, upgradeMailtoForCta } from '@/lib/plan/plan-limit-ui'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/shell/providers/language-provider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

type SidebarWorkspaceFooterProps = {
  companyName: string
  me: MeResponse | null
  collapsed: boolean
}

export function SidebarWorkspaceFooter({
  companyName,
  me,
  collapsed,
}: SidebarWorkspaceFooterProps) {
  const { lang } = useLanguage()
  const upgradeHref = me ? upgradeMailtoForCta(me.upgrade_cta) : null
  const planName = me?.plan_display_name?.trim() || me?.plan || ''
  const trialDays = me?.plan === 'trial' ? trialDaysRemaining(me.trial_ends_at) : null

  const planLine =
    me?.plan === 'trial' && trialDays != null
      ? shellT(lang, 'shellSidebarPlanTrialDays', { days: String(trialDays) })
      : shellT(lang, 'shellSidebarPlanNamed', { plan: planName })

  const upgradeLabel =
    me?.upgrade_cta === 'contact'
      ? shellT(lang, 'planUpgradeContactUs')
      : shellT(lang, 'planUpgradeToGrowth')

  const footer = (
    <div
      className={cn(
        'border-t border-[var(--shell-divider)] pt-3',
        collapsed ? 'flex flex-col items-center gap-2 px-0' : 'space-y-2',
      )}
    >
      <div className={cn('min-w-0', collapsed ? 'text-center' : '')}>
        <p
          className={cn(
            'truncate font-semibold text-text-primary',
            collapsed ? 'max-w-[2.5rem] text-[10px] leading-tight' : 'text-sm',
          )}
          title={companyName}
        >
          {collapsed ? companyName.slice(0, 2).toUpperCase() : companyName}
        </p>
        {!collapsed ? (
          <p className="truncate text-xs text-text-tertiary" title={planLine}>
            {planLine}
          </p>
        ) : null}
      </div>
      {upgradeHref ? (
        collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={upgradeHref}
                className="text-xs font-medium text-[var(--sidebar-primary)] underline-offset-2 hover:underline"
                aria-label={upgradeLabel}
              >
                ↑
              </a>
            </TooltipTrigger>
            <TooltipContent side="right">{upgradeLabel}</TooltipContent>
          </Tooltip>
        ) : (
          <a
            href={upgradeHref}
            className="inline-block text-xs font-medium text-[var(--sidebar-primary)] underline-offset-2 hover:underline"
          >
            {upgradeLabel}
          </a>
        )
      ) : null}
    </div>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">{footer}</div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-medium">{companyName}</p>
          <p className="text-text-secondary">{planLine}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return footer
}
