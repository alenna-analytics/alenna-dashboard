import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  StripeCheckoutButton,
  StripePortalButton,
} from '@/components/billing/stripe-checkout-button'
import {
  billingPlanDetailLine,
  billingPlanHeadline,
  formatPlanLimit,
  isBillingOwner,
  UPGRADE_ENTERPRISE_MAILTO,
} from '@/lib/plan/plan-limit-ui'
import { shellT } from '@/lib/i18n/shell-strings'
import type { MeResponse } from '@/lib/types/me-types'
import { cn } from '@/lib/utils'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { buttonVariants } from '@/ui/button'

function BillingSection({
  label,
  description,
  children,
  className,
}: {
  label: string
  description: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'grid gap-4 py-8 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-10 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-medium text-text-primary">{label}</h2>
        <p className="mt-1 text-sm leading-snug text-text-secondary">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function PlanChangeActions({ me }: { me: MeResponse }) {
  const { lang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )
  const normalized = me.plan.trim().toLowerCase()

  if (normalized === 'trial') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <StripeCheckoutButton plan="basic" label={t('billingSubscribeBasic')} variant="primary" />
        <StripeCheckoutButton plan="growth" label={t('billingUpgradeGrowth')} variant="accent" />
      </div>
    )
  }

  if (normalized === 'basic') {
    if (me.has_stripe_subscription) return null
    return (
      <div className="flex flex-wrap items-center gap-2">
        <StripeCheckoutButton plan="growth" label={t('billingUpgradeGrowth')} variant="accent" />
      </div>
    )
  }

  if (normalized === 'growth') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={UPGRADE_ENTERPRISE_MAILTO}
          className={buttonVariants({ variant: 'accent', size: 'sm' })}
        >
          {t('planUpgradeToEnterprise')}
        </a>
      </div>
    )
  }

  return null
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

  const planLine = me ? billingPlanHeadline(me, lang) : '—'
  const planDetailLine = me ? billingPlanDetailLine(me, lang) : null
  const isOwner = isBillingOwner(me)
  const showPayment = Boolean(isOwner && me?.has_stripe_subscription)
  const planActions = isOwner && me ? <PlanChangeActions me={me} /> : null

  return (
    <DashboardPage className="space-y-2">
      <section className="pb-4">
        <h1 className="text-subtitle font-semibold tracking-[-0.02em] text-text-primary">
          {t('navBilling')}
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary">{t('billingPageSubtitle')}</p>
      </section>

      {checkoutFeedbackKey ? (
        <p className="rounded-md border border-border-default bg-[var(--platinum-blonde-300)] px-4 py-3 text-sm text-text-primary">
          {t(checkoutFeedbackKey)}
        </p>
      ) : null}

      {!isOwner ? (
        <p className="text-sm text-text-secondary">{t('billingOwnerOnly')}</p>
      ) : null}

      <div className="divide-y divide-border-default border-y border-border-default">
        <BillingSection
          label={t('billingCurrentPlanLabel')}
          description={t('billingCurrentPlanDescription')}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-[-0.01em] text-text-primary">{planLine}</p>
              {planDetailLine ? (
                <p className="mt-1 text-sm text-text-tertiary">{planDetailLine}</p>
              ) : null}
            </div>
            {planActions}
          </div>
        </BillingSection>

        {showPayment && me ? (
          <BillingSection
            label={t('billingPaymentLabel')}
            description={t('billingPaymentDescription')}
          >
            <div className="flex sm:justify-end">
              <StripePortalButton label={t('billingUpdateInStripe')} />
            </div>
          </BillingSection>
        ) : null}

        <BillingSection
          label={t('billingUsageLabel')}
          description={t('billingUsageDescription')}
        >
          <div className="divide-y divide-border-subtle">
            <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{t('billingOrdersLimitLabel')}</p>
                <p className="mt-0.5 text-xs text-text-tertiary">{t('billingOrdersLimitDescription')}</p>
              </div>
              <p className="shrink-0 text-sm font-medium text-text-primary">
                {formatPlanLimit(me?.orders_used, lang)} / {formatPlanLimit(me?.orders_limit, lang)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{t('billingSkusLimitLabel')}</p>
                <p className="mt-0.5 text-xs text-text-tertiary">{t('billingSkusLimitDescription')}</p>
              </div>
              <p className="shrink-0 text-sm font-medium text-text-primary">
                {formatPlanLimit(me?.skus_used, lang)} / {formatPlanLimit(me?.skus_limit, lang)}
              </p>
            </div>
          </div>
        </BillingSection>
      </div>
    </DashboardPage>
  )
}
