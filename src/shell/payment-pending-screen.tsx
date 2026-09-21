import { PlanCtaButton } from '@/components/billing/plan-cta-button'
import {
  paymentPendingCancelUrl,
  type CheckoutPlanSlug,
} from '@/lib/billing/billing-api'
import { UPGRADE_ENTERPRISE_MAILTO } from '@/lib/plan/plan-limit-ui'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'
import { BillingGateScreen } from '@/shell/billing-gate-screen'
import { BillingGateSignOutButton } from '@/shell/billing-gate-sign-out-button'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { buttonVariants } from '@/ui/button'

function renewPlanForMe(
  signupIntent: 'trial' | 'growth' | undefined,
  pendingSlug: 'basic' | 'growth' | null | undefined,
): CheckoutPlanSlug {
  if (pendingSlug === 'basic' || pendingSlug === 'growth') return pendingSlug
  return signupIntent === 'growth' ? 'growth' : 'basic'
}

export function PaymentPendingScreen() {
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const t = (key: ShellStringKey, vars?: Readonly<Record<string, string>>) =>
    shellT(lang, key, vars)

  const lapsedCustomer = Boolean(me?.has_stripe_customer)
  const pendingSlug = me?.pending_stripe_plan_slug
  const renewPlan = renewPlanForMe(me?.signup_intent, pendingSlug)
  const renewPlanLabel =
    renewPlan === 'growth' ? t('billingPlanNameGrowth') : t('billingPlanNameBasic')
  const renewLabel = t('billingRenewWithPlan', { plan: renewPlanLabel })
  const checkoutOptions = { cancelUrl: paymentPendingCancelUrl() }
  const gateButtonClass = 'min-w-44 rounded-lg px-6'

  // After Shopify uninstall, prefer the mapped pending Stripe plan only.
  if (pendingSlug === 'basic' || pendingSlug === 'growth') {
    return (
      <BillingGateScreen
        title={t('subscriptionInactiveTitle')}
        description={t('subscriptionInactiveBody')}
        actions={
          <PlanCtaButton
            plan={pendingSlug}
            label={renewLabel}
            variant="accent"
            size="default"
            className={gateButtonClass}
            checkoutOptions={checkoutOptions}
          />
        }
        footer={<BillingGateSignOutButton label={t('paymentPendingSignOut')} />}
      />
    )
  }

  // Growth onboarding unpaid: single renew CTA.
  // Lapsed Stripe customers: offer Basic + Growth (prior plan is unknown after cancel → trial).
  // Otherwise renew + upgrade.
  const singleRenewOnly =
    me?.signup_intent === 'growth' && !lapsedCustomer

  return (
    <BillingGateScreen
      title={t('subscriptionInactiveTitle')}
      description={t('subscriptionInactiveBody')}
      actions={
        singleRenewOnly ? (
          <PlanCtaButton
            plan="growth"
            label={renewLabel}
            variant="accent"
            size="default"
            className={gateButtonClass}
            checkoutOptions={checkoutOptions}
          />
        ) : lapsedCustomer ? (
          <>
            <PlanCtaButton
              plan="basic"
              label={t('billingRenewWithPlan', { plan: t('billingPlanNameBasic') })}
              variant="accent"
              size="default"
              className={gateButtonClass}
              checkoutOptions={checkoutOptions}
            />
            <PlanCtaButton
              plan="growth"
              label={t('billingRenewWithPlan', { plan: t('billingPlanNameGrowth') })}
              variant="success"
              size="default"
              className={gateButtonClass}
              checkoutOptions={checkoutOptions}
            />
          </>
        ) : renewPlan === 'growth' ? (
          <>
            <PlanCtaButton
              plan="growth"
              label={renewLabel}
              variant="accent"
              size="default"
              className={gateButtonClass}
              checkoutOptions={checkoutOptions}
            />
            <a
              href={UPGRADE_ENTERPRISE_MAILTO}
              className={cn(buttonVariants({ variant: 'success', size: 'default' }), gateButtonClass)}
            >
              {t('planUpgradeToEnterprise')}
            </a>
          </>
        ) : (
          <>
            <PlanCtaButton
              plan="basic"
              label={renewLabel}
              variant="accent"
              size="default"
              className={gateButtonClass}
              checkoutOptions={checkoutOptions}
            />
            <PlanCtaButton
              plan="growth"
              label={t('planUpgradeToGrowth')}
              variant="success"
              size="default"
              className={gateButtonClass}
              checkoutOptions={checkoutOptions}
            />
          </>
        )
      }
      footer={<BillingGateSignOutButton label={t('paymentPendingSignOut')} />}
    />
  )
}
