import type { ReactNode } from 'react'
import { useCallback } from 'react'

import {
  formatPlanLimit,
  planSummaryLabel,
} from '@/lib/plan/plan-limit-ui'
import { shellT } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'

function SettingsSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn(className)}>
      <div className="w-full overflow-hidden rounded-md border border-border-default bg-white divide-y divide-border-default">
        {children}
      </div>
    </section>
  )
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="mt-0.5 text-sm leading-snug text-text-secondary">{description}</p>
      </div>
      <div className="w-full min-w-0 sm:max-w-sm sm:shrink-0">{children}</div>
    </div>
  )
}

export function BillingConfigurationPage() {
  const { lang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1], vars?: Parameters<typeof shellT>[2]) =>
      shellT(lang, key, vars),
    [lang],
  )
  const { me } = useWorkspace()

  const planLine = me ? planSummaryLabel(me, lang) : '—'

  return (
    <DashboardPage className="space-y-8">
      <section>
        <div className="w-full">
          <h1 className="text-subtitle font-semibold tracking-[-0.02em] text-text-primary">
            {t('navBilling')}
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">{t('billingPageSubtitle')}</p>
        </div>
      </section>

      <SettingsSection>
        <SettingsRow label={t('billingCurrentPlanLabel')} description={t('billingCurrentPlanDescription')}>
          <p className="text-sm font-medium text-text-primary">{planLine}</p>
        </SettingsRow>

        <SettingsRow label={t('billingOrdersLimitLabel')} description={t('billingOrdersLimitDescription')}>
          <p className="text-sm font-medium text-text-primary">
            {formatPlanLimit(me?.orders_used, lang)} / {formatPlanLimit(me?.orders_limit, lang)}
          </p>
        </SettingsRow>

        <SettingsRow label={t('billingSkusLimitLabel')} description={t('billingSkusLimitDescription')}>
          <p className="text-sm font-medium text-text-primary">
            {formatPlanLimit(me?.skus_used, lang)} / {formatPlanLimit(me?.skus_limit, lang)}
          </p>
        </SettingsRow>
      </SettingsSection>

      <p className="text-sm text-text-secondary">{t('billingStripeComingSoon')}</p>
    </DashboardPage>
  )
}
