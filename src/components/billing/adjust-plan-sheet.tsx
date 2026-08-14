import { StripeCheckoutButton, StripePortalButton } from '@/components/billing/stripe-checkout-button'
import { shellT } from '@/lib/i18n/shell-strings'
import { UPGRADE_ENTERPRISE_MAILTO } from '@/lib/plan/plan-limit-ui'
import type { MeResponse } from '@/lib/types/me-types'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/shell/providers/language-provider'
import { Badge } from '@/ui/badge'
import { Button, buttonVariants } from '@/ui/button'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'

type AdjustPlanSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  me: MeResponse
}

type AdjustPlanId = 'basic' | 'growth' | 'enterprise'

function currentPlanId(me: MeResponse): AdjustPlanId {
  const slug = me.plan.trim().toLowerCase()
  if (slug === 'growth') return 'growth'
  if (slug === 'enterprise' || slug === 'custom') return 'enterprise'
  return 'basic'
}

export function AdjustPlanSheet({ open, onOpenChange, me }: AdjustPlanSheetProps) {
  const { lang } = useLanguage()
  const current = currentPlanId(me)
  const hasStripe = Boolean(me.has_stripe_subscription)

  const plans: Array<{
    id: AdjustPlanId
    name: string
    price: string
    description: string
    features: string[]
  }> = [
    {
      id: 'basic',
      name: 'Basic',
      price: shellT(lang, 'billingPlanPriceBasic'),
      description: shellT(lang, 'billingPlanDescriptionBasic'),
      features: [
        shellT(lang, 'billingPlanFeatureBasicOrders'),
        shellT(lang, 'billingPlanFeatureBasicSkus'),
        shellT(lang, 'billingPlanFeatureBasicUsers'),
        shellT(lang, 'billingPlanFeatureBasicRoles'),
        shellT(lang, 'billingPlanFeatureModules'),
        shellT(lang, 'billingPlanFeatureIntegrations'),
        shellT(lang, 'billingPlanFeatureReports'),
        shellT(lang, 'billingPlanFeatureSync'),
        shellT(lang, 'billingPlanFeatureSupport'),
      ],
    },
    {
      id: 'growth',
      name: 'Growth',
      price: shellT(lang, 'billingPlanPriceGrowth'),
      description: shellT(lang, 'billingPlanDescriptionGrowth'),
      features: [
        shellT(lang, 'billingPlanFeatureGrowthOrders'),
        shellT(lang, 'billingPlanFeatureGrowthSkus'),
        shellT(lang, 'billingPlanFeatureGrowthUsers'),
        shellT(lang, 'billingPlanFeatureGrowthRoles'),
        shellT(lang, 'billingPlanFeatureCore'),
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: shellT(lang, 'billingPlanPriceEnterprise'),
      description: shellT(lang, 'billingPlanDescriptionEnterprise'),
      features: [shellT(lang, 'billingPlanFeatureEnterprise'), shellT(lang, 'billingPlanFeatureCore')],
    },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-[min(52rem,100%)]">
        <SheetHeader>
          <SheetTitle>{shellT(lang, 'billingAdjustPlanTitle')}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <SheetDescription>{shellT(lang, 'billingCurrentPlanDescription')}</SheetDescription>

          <div className="grid gap-3 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.id === current
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'flex flex-col rounded-md border border-border-subtle p-4',
                    isCurrent && 'bg-muted/40',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{plan.name}</p>
                      <p className="mt-0.5 text-sm text-text-secondary">{plan.price}</p>
                    </div>
                    {isCurrent ? (
                      <Badge variant="secondary">{shellT(lang, 'billingAdjustPlanCurrent')}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 text-xs leading-snug text-text-tertiary">{plan.description}</p>
                  <ul className="mt-3 flex flex-1 flex-col gap-1.5 text-xs text-text-secondary">
                    {plan.features.map((feature) => (
                      <li key={feature}>· {feature}</li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    {isCurrent ? (
                      <Button type="button" variant="outline" size="sm" className="w-full" disabled>
                        {shellT(lang, 'billingAdjustPlanYourCurrent')}
                      </Button>
                    ) : plan.id === 'enterprise' ? (
                      <a
                        href={UPGRADE_ENTERPRISE_MAILTO}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
                      >
                        {shellT(lang, 'billingAdjustEnterpriseCta')}
                      </a>
                    ) : hasStripe ? (
                      <StripePortalButton
                        label={shellT(lang, 'billingAdjustPlanChoose')}
                        variant="primary"
                        className="w-full"
                      />
                    ) : (
                      <StripeCheckoutButton
                        plan={plan.id}
                        label={shellT(lang, 'billingAdjustPlanChoose')}
                        variant={plan.id === 'growth' ? 'accent' : 'primary'}
                        className="w-full"
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-text-tertiary">{shellT(lang, 'billingAdjustEnterpriseFooter')}</p>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
