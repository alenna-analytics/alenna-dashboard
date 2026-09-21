import { useAuth } from '@clerk/react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import {
  BillingUseCustomerPortalError,
  createCheckoutSession,
  createShopifyPlanRedirect,
  redirectToShopifyBilling,
  redirectToStripe,
  type CheckoutPlanSlug,
  type CheckoutSessionOptions,
} from '@/lib/billing/billing-api'
import { shellT } from '@/lib/i18n/shell-strings'
import { signalSubscriptionAlreadyActive } from '@/lib/trial-expired-signal'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button, type buttonVariants } from '@/ui/button'

type PlanCtaButtonProps = {
  plan: CheckoutPlanSlug
  label: ReactNode
  variant?: NonNullable<Parameters<typeof buttonVariants>[0]>['variant']
  size?: NonNullable<Parameters<typeof buttonVariants>[0]>['size']
  className?: string
  ownerOnly?: boolean
  checkoutOptions?: CheckoutSessionOptions
}

export function PlanCtaButton({
  plan,
  label,
  variant = 'primary',
  size = 'sm',
  className,
  ownerOnly = true,
  checkoutOptions,
}: PlanCtaButtonProps) {
  const { getToken } = useAuth()
  const { lang } = useLanguage()
  const { me, refetchMe } = useWorkspace()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  if (!me) return null
  if (ownerOnly && me.role !== 'owner') return null

  const useShopify = Boolean(me.can_use_shopify_plans)
  const useStripe = Boolean(me.can_use_stripe_checkout)
  if (!useShopify && !useStripe) return null

  async function handleClick() {
    if (!me) return
    setLoading(true)
    try {
      if (useShopify) {
        const url = await createShopifyPlanRedirect((args) => getToken(args), me.tenant_id)
        redirectToShopifyBilling(url)
        return
      }
      const url = await createCheckoutSession(
        plan,
        (args) => getToken(args),
        me.tenant_id,
        checkoutOptions,
      )
      redirectToStripe(url)
    } catch (error) {
      if (error instanceof BillingUseCustomerPortalError) {
        signalSubscriptionAlreadyActive()
        toast.success(shellT(lang, 'billingSubscriptionAlreadyActive'))
        void refetchMe()
        navigate('/dashboard', { replace: true })
        setLoading(false)
        return
      }
      const message = error instanceof Error ? error.message : 'Checkout failed'
      toast.error(message)
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      loading={loading}
      onClick={() => void handleClick()}
    >
      {label}
    </Button>
  )
}
