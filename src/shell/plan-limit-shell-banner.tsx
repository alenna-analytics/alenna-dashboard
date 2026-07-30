import { AlertTriangle } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import { isPlanLimitSyncPaused, upgradeMailtoForCta } from '@/lib/plan/plan-limit-ui'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { buttonVariants } from '@/ui/button'

export function PlanLimitShellBanner() {
  const { lang } = useLanguage()
  const { me } = useWorkspace()

  if (!isPlanLimitSyncPaused(me)) {
    return null
  }

  const reason = me?.sync_paused_reason
  const messageKey =
    reason === 'orders_limit'
      ? 'planLimitBannerOrders'
      : reason === 'skus_limit'
        ? 'planLimitBannerSkus'
        : 'planLimitBannerGeneric'

  const upgradeHref = me ? upgradeMailtoForCta(me.upgrade_cta) : null
  const ctaLabel =
    me?.upgrade_cta === 'contact'
      ? shellT(lang, 'planUpgradeContactUs')
      : shellT(lang, 'planUpgradeToGrowth')

  return (
    <div
      className="border-b border-[var(--status-warning-200,#fde68a)] bg-[var(--status-warning-50,#fffbeb)] px-4 py-2 text-sm text-text-primary"
      role="status"
    >
      <div className="mx-auto flex max-w-none flex-wrap items-center gap-x-3 gap-y-2 lg:max-w-[1600px]">
        <AlertTriangle
          className="size-4 shrink-0 text-[var(--status-warning-600,#d97706)]"
          aria-hidden
        />
        <p className="min-w-0 flex-1">{shellT(lang, messageKey)}</p>
        {upgradeHref ? (
          <a href={upgradeHref} className={cn(buttonVariants({ size: 'sm' }), 'h-8 shrink-0')}>
            {ctaLabel}
          </a>
        ) : null}
      </div>
    </div>
  )
}
