import { useAuth } from '@clerk/react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  BillingUseCustomerPortalError,
  createCheckoutSession,
  createCustomerPortalSession,
  redirectToStripe,
  type CheckoutPlanSlug,
  type CheckoutSessionOptions,
} from '@/lib/billing/billing-api'
import { shellT } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button, type buttonVariants } from '@/ui/button'

type StripeCheckoutButtonProps = {
  plan: CheckoutPlanSlug
  label: string
  variant?: NonNullable<Parameters<typeof buttonVariants>[0]>['variant']
  size?: NonNullable<Parameters<typeof buttonVariants>[0]>['size']
  className?: string
  ownerOnly?: boolean
  checkoutOptions?: CheckoutSessionOptions
}

export function StripeCheckoutButton({
  plan,
  label,
  variant = 'primary',
  size = 'sm',
  className,
  ownerOnly = true,
  checkoutOptions,
}: StripeCheckoutButtonProps) {
  const { getToken } = useAuth()
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const [loading, setLoading] = useState(false)

  if (!me) return null
  if (ownerOnly && me.role !== 'owner') return null

  async function handleClick() {
    if (!me) return
    setLoading(true)
    try {
      const url = await createCheckoutSession(
        plan,
        (args) => getToken(args),
        me.tenant_id,
        checkoutOptions,
      )
      redirectToStripe(url)
    } catch (error) {
      const message =
        error instanceof BillingUseCustomerPortalError
          ? shellT(lang, 'billingUseCustomerPortal')
          : error instanceof Error
            ? error.message
            : 'Checkout failed'
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
      disabled={loading}
      onClick={() => void handleClick()}
    >
      {loading ? '…' : label}
    </Button>
  )
}

type StripePortalButtonProps = {
  label: string
  variant?: NonNullable<Parameters<typeof buttonVariants>[0]>['variant']
  size?: NonNullable<Parameters<typeof buttonVariants>[0]>['size']
  className?: string
}

export function StripePortalButton({
  label,
  variant = 'outline',
  size = 'sm',
  className,
}: StripePortalButtonProps) {
  const { getToken } = useAuth()
  const { me } = useWorkspace()
  const [loading, setLoading] = useState(false)

  if (!me || me.role !== 'owner' || !me.has_stripe_subscription) return null

  async function handleClick() {
    if (!me) return
    setLoading(true)
    try {
      const url = await createCustomerPortalSession((args) => getToken(args), me.tenant_id)
      redirectToStripe(url)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Portal failed'
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
      disabled={loading}
      onClick={() => void handleClick()}
    >
      {loading ? '…' : label}
    </Button>
  )
}
