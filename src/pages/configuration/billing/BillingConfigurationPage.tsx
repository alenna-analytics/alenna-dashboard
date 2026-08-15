import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, FileText, AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

import { AdjustPlanSheet } from '@/components/billing/adjust-plan-sheet'
import { UsageProgressRing } from '@/components/billing/usage-progress-ring'
import { CancelSubscriptionButton } from '@/components/billing/cancel-subscription-button'
import {
  StripeCheckoutButton,
  StripePortalButton,
} from '@/components/billing/stripe-checkout-button'
import {
  fetchBillingOrdersDaily,
  fetchBillingOverview,
  type BillingInvoice,
  type BillingOverview,
} from '@/lib/billing/billing-api'
import {
  billingCatalogDescription,
  billingCatalogPrice,
  billingPlanDetailLine,
  billingPlanDisplayName,
  billingPlanHeadline,
  cycleProgressPct,
  daysUntilIso,
  formatBillingDate,
  formatMoneyCents,
  formatPlanLimit,
  formatTrialEndDate,
  isBillingOwner,
  isPlanLimitSyncPaused,
  UPGRADE_ENTERPRISE_MAILTO,
  usageProgressRatio,
} from '@/lib/plan/plan-limit-ui'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { MeResponse } from '@/lib/types/me-types'
import { cn } from '@/lib/utils'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage, type Language } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Badge } from '@/ui/badge'
import { Button, buttonVariants } from '@/ui/button'
import { ContextAlertCard } from '@/ui/context-alert'
import { EmptyState } from '@/ui/empty-state'
import { BillingOrdersDailyChart } from './billing-orders-daily-chart'

function BillingSection({
  label,
  description,
  children,
  className,
}: {
  label: string
  description: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'grid gap-4 py-12 sm:grid-cols-[3fr_7fr] sm:gap-10',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-medium text-text-primary">{label}</h2>
        <div className="mt-1 text-sm leading-snug text-[#464646]">{description}</div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function PlanChangeActions({
  me,
  onChangePlan,
}: {
  me: MeResponse
  onChangePlan: () => void
}) {
  const { lang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )
  const normalized = me.plan.trim().toLowerCase()

  if (normalized === 'trial') {
    return (
      <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2">
        <StripeCheckoutButton plan="basic" label={t('billingSubscribeBasic')} variant="primary" size="tiny" />
        <StripeCheckoutButton plan="growth" label={t('billingUpgradeGrowth')} variant="accent" size="tiny" />
      </div>
    )
  }

  if (me.has_stripe_subscription) {
    return (
      <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2">
        <Button type="button" variant="success" size="tiny" onClick={onChangePlan}>
          {t('billingChangePlan')}
        </Button>
        <CancelSubscriptionButton />
      </div>
    )
  }

  if (normalized === 'basic') {
    return (
      <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2">
        <StripeCheckoutButton plan="growth" label={t('billingUpgradeGrowth')} variant="accent" size="tiny" />
      </div>
    )
  }

  if (normalized === 'growth') {
    return (
      <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2">
        <a
          href={UPGRADE_ENTERPRISE_MAILTO}
          className={buttonVariants({ variant: 'accent', size: 'tiny' })}
        >
          {t('planUpgradeToEnterprise')}
        </a>
      </div>
    )
  }

  return null
}

function invoiceStatusKey(status: string): ShellStringKey {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'paid') return 'billingInvoiceStatusPaid'
  if (normalized === 'open') return 'billingInvoiceStatusOpen'
  if (normalized === 'draft') return 'billingInvoiceStatusDraft'
  if (normalized === 'void') return 'billingInvoiceStatusVoid'
  if (normalized === 'uncollectible') return 'billingInvoiceStatusUncollectible'
  return 'billingInvoiceStatusOpen'
}

function InvoiceStatusBadge({ status, lang }: { status: string; lang: Language }) {
  const paid = status.trim().toLowerCase() === 'paid'
  return (
    <Badge variant={paid ? 'success' : 'secondary'}>
      {shellT(lang, invoiceStatusKey(status))}
    </Badge>
  )
}

function UsageRow({
  label,
  description,
  used,
  limit,
  lang,
}: {
  label: string
  description: string
  used: number | null | undefined
  limit: number | null | undefined
  lang: Language
}) {
  const ratio = usageProgressRatio(used, limit)
  const pctLabel = ratio == null ? null : `${Math.round(ratio * 100)}%`

  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <p className="text-sm font-medium text-text-primary">
          {formatPlanLimit(used, lang)} / {formatPlanLimit(limit, lang)}
          {pctLabel ? (
            <span className="font-normal text-text-tertiary"> ({pctLabel})</span>
          ) : null}
        </p>
        <UsageProgressRing ratio={ratio} label={label} />
      </div>
    </div>
  )
}

function UsageRows({ me, lang }: { me: MeResponse | null; lang: Language }) {
  return (
    <div className="divide-y divide-border-subtle">
      <UsageRow
        lang={lang}
        label={shellT(lang, 'billingOrdersLimitLabel')}
        description={shellT(lang, 'billingOrdersLimitDescription')}
        used={me?.orders_used}
        limit={me?.orders_limit}
      />
      <UsageRow
        lang={lang}
        label={shellT(lang, 'billingSkusLimitLabel')}
        description={shellT(lang, 'billingSkusLimitDescription')}
        used={me?.skus_used}
        limit={me?.skus_limit}
      />
      <UsageRow
        lang={lang}
        label={shellT(lang, 'billingUsersLimitLabel')}
        description={shellT(lang, 'billingUsersLimitDescription')}
        used={me?.users_used}
        limit={me?.users_limit}
      />
    </div>
  )
}

function PastInvoicesTable({
  invoices,
  lang,
}: {
  invoices: BillingInvoice[]
  lang: Language
}) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-md border border-border-subtle">
        <EmptyState icon="billing" title={shellT(lang, 'billingInvoicesEmpty')} />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border-subtle">
          <table className="w-full min-w-lg text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-3 py-2">{shellT(lang, 'billingInvoiceDate')}</th>
            <th className="px-3 py-2">{shellT(lang, 'billingInvoiceAmount')}</th>
            <th className="px-3 py-2">{shellT(lang, 'billingInvoiceNumber')}</th>
            <th className="px-3 py-2">{shellT(lang, 'billingInvoiceStatus')}</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-border-subtle last:border-0">
              <td className="px-3 py-2.5 text-text-primary">
                <span className="inline-flex items-center gap-2">
                  <FileText className="size-3.5 text-text-tertiary" aria-hidden />
                  {formatTrialEndDate(invoice.created_at, lang) ?? '—'}
                </span>
              </td>
              <td className="px-3 py-2.5 font-medium text-text-primary">
                {formatMoneyCents(invoice.amount_cents, invoice.currency, lang)}
              </td>
              <td className="px-3 py-2.5 text-text-tertiary">{invoice.number ?? '—'}</td>
              <td className="px-3 py-2.5">
                <InvoiceStatusBadge status={invoice.status} lang={lang} />
              </td>
              <td className="px-3 py-2.5 text-right">
                {invoice.hosted_invoice_url ? (
                  <a
                    href={invoice.hosted_invoice_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
                  >
                    {shellT(lang, 'billingInvoiceView')}
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  const { getToken } = useAuth()
  const { me, refetchMe } = useWorkspace()
  const [searchParams, setSearchParams] = useSearchParams()
  const [adjustOpen, setAdjustOpen] = useState(false)
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

  const isOwner = isBillingOwner(me)
  const subscribed = Boolean(isOwner && me?.has_stripe_subscription)
  const overviewQuery = useQuery({
    queryKey: ['billing', 'overview', me?.tenant_id],
    enabled: subscribed && Boolean(me?.tenant_id),
    queryFn: async (): Promise<BillingOverview> => {
      if (!me) throw new Error('missing workspace')
      return fetchBillingOverview((args) => getToken(args), me.tenant_id)
    },
  })
  const overview = overviewQuery.data
  const ordersDailyQuery = useQuery({
    queryKey: ['billing', 'orders-daily', me?.tenant_id],
    enabled: isOwner && Boolean(me?.tenant_id),
    queryFn: async () => {
      if (!me) throw new Error('missing workspace')
      return fetchBillingOrdersDaily((args) => getToken(args), me.tenant_id)
    },
  })

  const trialHeadline = me ? billingPlanHeadline(me, lang) : '—'
  const trialDetail = me ? billingPlanDetailLine(me, lang) : null
  const subscribedName = me ? billingPlanDisplayName(me) : '—'
  const catalogPrice = me ? billingCatalogPrice(me.plan, lang) : null
  const stripePrice =
    overview?.plan_amount_cents != null && overview.currency
      ? `${formatMoneyCents(overview.plan_amount_cents, overview.currency, lang)}/${lang === 'en' ? 'mo' : 'mes'}`
      : catalogPrice
  const subscribedDescription = me ? billingCatalogDescription(me.plan, lang) : null
  const renewDate = formatBillingDate(overview?.current_period_end ?? null, lang)
  const periodStart = formatBillingDate(overview?.current_period_start ?? null, lang)
  const periodEnd = formatBillingDate(overview?.current_period_end ?? null, lang)
  const daysLeft = daysUntilIso(overview?.current_period_end)
  const progress = cycleProgressPct(
    overview?.current_period_start,
    overview?.current_period_end,
  )
  const planLimitReached = isPlanLimitSyncPaused(me)
  const planLimitAlertSubtitleKey =
    me?.sync_paused_reason === 'orders_limit'
      ? 'planLimitBillingAlertOrders'
      : me?.sync_paused_reason === 'skus_limit'
        ? 'planLimitBillingAlertSkus'
        : 'planLimitBillingAlertGeneric'

  if (me && !isOwner) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardPage className="space-y-2">
      <section className="pb-2">
          <h1 className={pageTitleClassName}>
          {t('navBilling')}
        </h1>
        <p className="mt-1.5 text-sm text-[#464646]">{t('billingPageSubtitle')}</p>
      </section>

      {checkoutFeedbackKey ? (
        <p className="rounded-md border border-border-default bg-[var(--platinum-blonde-300)] px-4 py-3 text-sm text-text-primary">
          {t(checkoutFeedbackKey)}
        </p>
      ) : null}

      {planLimitReached ? (
        <ContextAlertCard
          tone="warning"
          icon={AlertTriangle}
          title={t('planLimitBillingAlertTitle')}
          subtitle={t(planLimitAlertSubtitleKey)}
          action={
            isOwner && me ? (
              <Button type="button" variant="accent" size="tiny" onClick={() => setAdjustOpen(true)}>
                {t('billingChangePlan')}
              </Button>
            ) : null
          }
        />
      ) : null}

      <div className="divide-y divide-border-default">
        <BillingSection
          label={t('billingCurrentPlanLabel')}
          description={t('billingCurrentPlanDescription')}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              {subscribed && me ? (
                <>
                  <p className={pageTitleClassName}>
                    {subscribedName}
                    {stripePrice ? (
                      <span className="ml-2 text-sm font-normal tracking-normal text-text-secondary">
                        {stripePrice}
                      </span>
                    ) : null}
                  </p>
                  {subscribedDescription ? (
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">{subscribedDescription}</p>
                  ) : null}
                  {renewDate ? (
                    <p className="mt-1 text-sm text-text-tertiary">
                      {t('billingSubscriptionRenewsOn', { date: renewDate })}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <p className={pageTitleClassName}>
                    {trialHeadline}
                  </p>
                  {trialDetail ? (
                    <p className="mt-1 text-sm text-text-tertiary">{trialDetail}</p>
                  ) : null}
                </>
              )}
            </div>
            {isOwner && me ? (
              <PlanChangeActions me={me} onChangePlan={() => setAdjustOpen(true)} />
            ) : null}
          </div>
        </BillingSection>

        {subscribed && me ? (
          <BillingSection
            label={t('billingPaymentLabel')}
            description={t('billingPaymentDescription')}
          >
            <div className="flex sm:justify-end">
              <StripePortalButton label={t('billingUpdateInStripe')} variant="accent" />
            </div>
          </BillingSection>
        ) : null}

        {subscribed ? (
          <BillingSection
            label={t('billingUpcomingInvoiceLabel')}
            description={
              <div className="space-y-2">
                {periodStart && periodEnd ? (
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm text-text-primary">
                        {t('billingUpcomingInvoicePeriod', { start: periodStart, end: periodEnd })}
                      </p>
                      {daysLeft != null ? (
                        <p className="shrink-0 text-xs text-text-tertiary">
                          {t('billingUpcomingInvoiceDaysLeft', { days: String(daysLeft) })}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-subtle">
                      <div
                        className="h-full rounded-full bg-text-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : null}
                <p>
                  {periodEnd
                    ? t('billingUpcomingInvoiceDescription', { date: periodEnd })
                    : t('billingUsageDescription')}
                </p>
              </div>
            }
          >
            <div className="space-y-3">
              {overview?.plan_amount_cents != null && overview.currency ? (
                <div className="flex items-center justify-between gap-4 text-sm">
                  <p className="font-medium text-text-primary">{subscribedName}</p>
                  <p className="font-medium text-text-primary">
                    {formatMoneyCents(overview.plan_amount_cents, overview.currency, lang)}
                  </p>
                </div>
              ) : null}
              <UsageRows me={me} lang={lang} />
              {overview?.plan_amount_cents != null && overview.currency ? (
                <div className="flex items-center justify-between gap-4 border-t border-border-subtle pt-2.5 text-sm">
                  <p className="font-medium text-text-primary">{t('billingCurrentCosts')}</p>
                  <p className="font-medium text-text-primary">
                    {formatMoneyCents(overview.plan_amount_cents, overview.currency, lang)}
                  </p>
                </div>
              ) : null}
            </div>
          </BillingSection>
        ) : (
          <BillingSection
            label={t('billingUsageLabel')}
            description={t('billingUsageDescription')}
          >
            <UsageRows me={me} lang={lang} />
          </BillingSection>
        )}

        <BillingSection
          label={t('billingOrdersDailyLabel')}
          description={t('billingOrdersDailyDescription')}
        >
          <BillingOrdersDailyChart
            points={ordersDailyQuery.data?.points ?? []}
            lang={lang}
            isLoading={ordersDailyQuery.isPending}
            isError={ordersDailyQuery.isError}
          />
        </BillingSection>

        {subscribed ? (
          <BillingSection
            label={t('billingPastInvoicesLabel')}
            description={t('billingPastInvoicesDescription')}
          >
            <PastInvoicesTable invoices={overview?.invoices ?? []} lang={lang} />
          </BillingSection>
        ) : null}
      </div>

      {me ? (
        <AdjustPlanSheet open={adjustOpen} onOpenChange={setAdjustOpen} me={me} />
      ) : null}
    </DashboardPage>
  )
}
