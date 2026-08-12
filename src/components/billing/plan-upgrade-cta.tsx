import {
  StripeCheckoutButton,
  StripePortalButton,
} from '@/components/billing/stripe-checkout-button'
import {
  checkoutPlanForCta,
  upgradeIconForCta,
  upgradeLabelForCta,
  upgradeMailtoForCta,
} from '@/lib/plan/plan-limit-ui'
import { shellT } from '@/lib/i18n/shell-strings'
import type { MeResponse } from '@/lib/types/me-types'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/ui/app-icon'
import { buttonVariants } from '@/ui/button'
import type { Language } from '@/shell/providers/language-provider'

type PlanUpgradeCtaProps = {
  me: MeResponse
  lang: Language
  variant?: 'outline' | 'primary'
  size?: 'sm' | 'default'
  className?: string
}

export function PlanUpgradeCta({
  me,
  lang,
  variant = 'outline',
  size = 'sm',
  className,
}: PlanUpgradeCtaProps) {
  const checkoutPlan = checkoutPlanForCta(me.upgrade_cta)
  const mailtoHref = upgradeMailtoForCta(me.upgrade_cta)
  const label = upgradeLabelForCta(me.upgrade_cta, lang)
  const iconName = upgradeIconForCta(me.upgrade_cta)

  if (!label) return null

  const labelContent = iconName ? (
    <>
      <AppIcon name={iconName} colorize className="size-3.5 shrink-0" />
      {label}
    </>
  ) : (
    label
  )

  if (checkoutPlan && me.has_stripe_subscription) {
    return (
      <StripePortalButton
        label={shellT(lang, 'billingManageSubscription')}
        variant={variant}
        size={size}
        className={className}
      />
    )
  }

  if (checkoutPlan) {
    return (
      <StripeCheckoutButton
        plan={checkoutPlan}
        label={labelContent}
        variant={variant}
        size={size}
        className={className}
      />
    )
  }

  if (mailtoHref) {
    return (
      <a href={mailtoHref} className={cn(buttonVariants({ variant, size }), className)}>
        {labelContent}
      </a>
    )
  }

  return null
}
