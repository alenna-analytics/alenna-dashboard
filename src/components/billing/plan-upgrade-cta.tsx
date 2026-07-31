import { StripeCheckoutButton } from '@/components/billing/stripe-checkout-button'
import {
  checkoutPlanForCta,
  upgradeLabelForCta,
  upgradeMailtoForCta,
} from '@/lib/plan/plan-limit-ui'
import type { MeResponse } from '@/lib/types/me-types'
import { cn } from '@/lib/utils'
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

  if (!label) return null

  if (checkoutPlan) {
    return (
      <StripeCheckoutButton
        plan={checkoutPlan}
        label={label}
        variant={variant}
        size={size}
        className={className}
      />
    )
  }

  if (mailtoHref) {
    return (
      <a href={mailtoHref} className={cn(buttonVariants({ variant, size }), className)}>
        {label}
      </a>
    )
  }

  return null
}
