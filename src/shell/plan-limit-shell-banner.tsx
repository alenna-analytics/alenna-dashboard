import { AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import { isPlanLimitSyncPaused } from '@/lib/plan/plan-limit-ui'
import { cn } from '@/lib/utils'
import { WORKSPACE_SHELL_COLUMN_CLASS } from '@/shell/layout/workspace-shell-column'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'

const BILLING_PATH = '/dashboard/billing'

export function PlanLimitShellBanner() {
  const { lang } = useLanguage()
  const { me } = useWorkspace()

  if (!isPlanLimitSyncPaused(me)) {
    return null
  }

  const reason = me?.sync_paused_reason
  const detailKey =
    reason === 'orders_limit'
      ? 'planLimitBannerOrdersDetail'
      : reason === 'skus_limit'
        ? 'planLimitBannerSkusDetail'
        : 'planLimitBannerGenericDetail'

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'h-[var(--global-activity-bar-height)] border-b border-[var(--plan-limit-banner-border)]',
        'bg-[var(--plan-limit-banner-bg)] text-[var(--plan-limit-banner-fg)]',
      )}
    >
      <div
        className={cn(
          WORKSPACE_SHELL_COLUMN_CLASS,
          'flex h-full items-center justify-center gap-2 text-center text-sm',
        )}
      >
        <AlertCircle
          className="size-3.5 shrink-0 text-[var(--plan-limit-banner-icon)]"
          aria-hidden
        />
        <p className="min-w-0 leading-snug">
          <span className="font-medium">{shellT(lang, 'planLimitBannerTitle')}</span>
          <span className="opacity-80"> · {shellT(lang, detailKey)} </span>
          <Link
            to={BILLING_PATH}
            className="font-medium underline underline-offset-2 outline-none transition-opacity hover:opacity-90 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/45"
          >
            {shellT(lang, 'planLimitBannerBillingLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
