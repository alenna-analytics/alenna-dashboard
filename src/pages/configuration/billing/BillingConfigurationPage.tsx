import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  StripeCheckoutButton,
  StripePortalButton,
} from '@/components/billing/stripe-checkout-button'
import {
  formatPlanLimit,
  isBillingOwner,
  planSummaryLabel,
  UPGRADE_ENTERPRISE_MAILTO,
} from '@/lib/plan/plan-limit-ui'
import { shellT } from '@/lib/i18n/shell-strings'
import type { MeResponse } from '@/lib/types/me-types'
import { cn } from '@/lib/utils'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { buttonVariants } from '@/ui/button'

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

function BillingActions({ me }: { me: MeResponse }) {
  const { lang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )
  const normalized = me.plan.trim().toLowerCase()

  if (normalized === 'trial') {
    return (
      <div className="flex flex-col gap-2 sm:items-end">
        <StripeCheckoutButton plan="basic" label={t('billingSubscribeBasic')} variant="primary" />
        <StripeCheckoutButton plan="growth" label={t('billingUpgradeGrowth')} variant="outline" />
      </div>
    )
  }

  if (normalized === 'basic') {
    if (me.has_stripe_subscription) {
      return (
        <div className="flex flex-col gap-2 sm:items-end">
          <StripePortalButton label={t('billingManageSubscription')} />
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-2 sm:items-end">
        <StripeCheckoutButton plan="growth" label={t('billingUpgradeGrowth')} variant="primary" />
      </div>
    )
  }

  if (normalized === 'growth') {
    return (
      <div className="flex flex-col gap-2 sm:items-end">
        <a
          href={UPGRADE_ENTERPRISE_MAILTO}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          {t('planUpgradeToEnterprise')}
        </a>
        <StripePortalButton label={t('billingManageSubscription')} />
      </div>
    )
  }

  return <StripePortalButton label={t('billingManageSubscription')} />
}

export function BillingConfigurationPage() {
  const { lang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1], vars?: Parameters<typeof shellT>[2]) =>
      shellT(lang, key, vars),
    [lang],
  )
  const { me, refetchMe } = useWorkspace()
  const [searchParams, setSearchParams] = useSearchParams()
  const [checkoutFeedbackKey, setCheckoutFeedbackKey] = useState<
    'billingCheckoutSuccess' | 'billingCheckoutCancel' | null
  >(null)

  useEffect(() => {
    const status = searchParams.get('checkout')
    if (status === 'success') {
      setCheckoutFeedbackKey('billingCheckoutSuccess')
      void refetchMe()
    } else if (status === 'cancel') {
      setCheckoutFeedbackKey('billingCheckoutCancel')
    }
    if (status) {
      const next = new URLSearchParams(searchParams)
      next.delete('checkout')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on landing with ?checkout=
  }, [])

  const planLine = me ? planSummaryLabel(me, lang) : '—'
  const isOwner = isBillingOwner(me)

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

      {checkoutFeedbackKey ? (
        <p className="rounded-md border border-border-default bg-[var(--platinum-blonde-300)] px-4 py-3 text-sm text-text-primary">
          {t(checkoutFeedbackKey)}
        </p>
      ) : null}

      {!isOwner ? (
        <p className="text-sm text-text-secondary">{t('billingOwnerOnly')}</p>
      ) : null}

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

        {isOwner && me ? (
          <SettingsRow label={t('billingActionsLabel')} description={t('billingActionsDescription')}>
            <BillingActions me={me} />
          </SettingsRow>
        ) : null}
      </SettingsSection>
    </DashboardPage>
  )
}
