import { StripeCheckoutButton } from '@/components/billing/stripe-checkout-button'
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

function renewPlanForMe(signupIntent: 'trial' | 'growth' | undefined): CheckoutPlanSlug {
  return signupIntent === 'growth' ? 'growth' : 'basic'
}

export function PaymentPendingScreen() {
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const t = (key: ShellStringKey, vars?: Readonly<Record<string, string>>) =>
    shellT(lang, key, vars)

  const renewPlan = renewPlanForMe(me?.signup_intent)
  const renewPlanLabel =
    renewPlan === 'growth' ? t('billingPlanNameGrowth') : t('billingPlanNameBasic')
  const renewLabel = t('billingRenewWithPlan', { plan: renewPlanLabel })
  const checkoutOptions = { cancelUrl: paymentPendingCancelUrl() }
  const gateButtonClass = 'min-w-44 rounded-lg px-6'

  // Growth onboarding unpaid: single renew CTA. Otherwise renew + upgrade.
  const singleRenewOnly =
    me?.signup_intent === 'growth' && !me?.has_stripe_customer

  return (
    <BillingGateScreen
      title={t('subscriptionInactiveTitle')}
      description={t('subscriptionInactiveBody')}
      actions={
        singleRenewOnly ? (
          <StripeCheckoutButton
            plan="growth"
            label={renewLabel}
            variant="accent"
            size="default"
            className={gateButtonClass}
            checkoutOptions={checkoutOptions}
          />
        ) : renewPlan === 'growth' ? (
          <>
            <StripeCheckoutButton
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
            <StripeCheckoutButton
              plan="basic"
              label={renewLabel}
              variant="accent"
              size="default"
              className={gateButtonClass}
              checkoutOptions={checkoutOptions}
            />
            <StripeCheckoutButton
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
