import { AlertTriangle } from 'lucide-react'

import { PlanUpgradeCta } from '@/components/billing/plan-upgrade-cta'
import { shellT } from '@/lib/i18n/shell-strings'
import { isPlanLimitSyncPaused } from '@/lib/plan/plan-limit-ui'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'

export function PlanLimitSyncAlert({ className }: { className?: string }) {
  const { lang } = useLanguage()
  const { me } = useWorkspace()

  if (!isPlanLimitSyncPaused(me)) {
    return null
  }

  const reason = me?.sync_paused_reason
  const messageKey =
    reason === 'orders_limit'
      ? 'planLimitSyncOrders'
      : reason === 'skus_limit'
        ? 'planLimitSyncSkus'
        : 'planLimitSyncGeneric'

  const upgradeCtaVisible =
    me && (me.upgrade_cta === 'growth' || me.upgrade_cta === 'enterprise')

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-md border border-[var(--status-warning-200,#fde68a)] bg-[var(--status-warning-50,#fffbeb)] p-4 text-sm text-text-primary sm:flex-row sm:items-center',
        className,
      )}
      role="status"
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-[var(--status-warning-600,#d97706)]"
          aria-hidden
        />
        <p>{shellT(lang, messageKey)}</p>
      </div>
      {upgradeCtaVisible && me ? (
        <PlanUpgradeCta
          me={me}
          lang={lang}
          className="h-8 shrink-0 self-start sm:self-auto"
        />
      ) : null}
    </div>
  )
}
