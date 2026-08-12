import { Sparkles } from 'lucide-react'

import {
  StripeCheckoutButton,
  StripePortalButton,
} from '@/components/billing/stripe-checkout-button'
import {
  checkoutPlanForTarget,
  upgradeLabelForTarget,
  upgradeMailtoForTarget,
  upgradeTargetForPlan,
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
  const target = upgradeTargetForPlan(me.plan)
  const checkoutPlan = checkoutPlanForTarget(target)
  const mailtoHref = upgradeMailtoForTarget(target)
  const label = upgradeLabelForTarget(target, lang)

  if (!label) return null

  const labelContent = (
    <>
      <Sparkles className="size-3.5 shrink-0" aria-hidden />
      {label}
    </>
  )

  if (checkoutPlan && me.has_stripe_subscription) {
    return (
      <StripePortalButton
        label={labelContent}
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
