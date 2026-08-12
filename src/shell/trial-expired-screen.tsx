import { StripeCheckoutButton } from '@/components/billing/stripe-checkout-button'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { BillingGateScreen } from '@/shell/billing-gate-screen'
import { BillingGateSignOutButton } from '@/shell/billing-gate-sign-out-button'
import { useLanguage } from '@/shell/providers/language-provider'

export function TrialExpiredScreen() {
  const { lang } = useLanguage()
  const t = (key: ShellStringKey) => shellT(lang, key)

  return (
    <BillingGateScreen
      title={t('trialExpiredTitle')}
      description={t('trialExpiredBody')}
      actions={
        <>
          <StripeCheckoutButton
            plan="basic"
            label={t('billingSubscribeBasic')}
            variant="accent"
            size="default"
            className="min-w-44 rounded-lg px-6"
          />
          <StripeCheckoutButton
            plan="growth"
            label={t('billingUpgradeGrowth')}
            variant="success"
            size="default"
            className="min-w-44 rounded-lg px-6"
          />
        </>
      }
      footer={<BillingGateSignOutButton label={t('trialExpiredSignOut')} />}
    />
  )
}
