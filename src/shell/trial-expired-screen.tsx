import { PlanCtaButton } from '@/components/billing/plan-cta-button'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { BillingGateScreen } from '@/shell/billing-gate-screen'
import { BillingGateSignOutButton } from '@/shell/billing-gate-sign-out-button'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'

export function TrialExpiredScreen() {
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const t = (key: ShellStringKey) => shellT(lang, key)
  const pendingSlug = me?.pending_stripe_plan_slug

  const actions =
    pendingSlug === 'basic' || pendingSlug === 'growth' ? (
      <PlanCtaButton
        plan={pendingSlug}
        label={
          pendingSlug === 'growth' ? t('billingUpgradeGrowth') : t('billingSubscribeBasic')
        }
        variant="accent"
        size="default"
        className="min-w-44 rounded-lg px-6"
      />
    ) : (
      <>
        <PlanCtaButton
          plan="basic"
          label={t('billingSubscribeBasic')}
          variant="accent"
          size="default"
          className="min-w-44 rounded-lg px-6"
        />
        <PlanCtaButton
          plan="growth"
          label={t('billingUpgradeGrowth')}
          variant="success"
          size="default"
          className="min-w-44 rounded-lg px-6"
        />
      </>
    )

  return (
    <BillingGateScreen
      title={t('trialExpiredTitle')}
      description={t('trialExpiredBody')}
      actions={actions}
      footer={<BillingGateSignOutButton label={t('trialExpiredSignOut')} />}
    />
  )
}
