import { shellT } from '@/lib/i18n/shell-strings'
import type { MeResponse } from '@/lib/types/me-types'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/shell/providers/language-provider'

type BillingProviderBannerProps = {
  me: MeResponse | null
  className?: string
}

export function BillingProviderBanner({ me, className }: BillingProviderBannerProps) {
  const { lang } = useLanguage()
  if (!me?.billing_provider_label?.trim()) return null

  const transitionKey =
    me.billing_transition === 'to_shopify'
      ? 'billingTransitionToShopify'
      : me.billing_transition === 'to_stripe'
        ? 'billingTransitionToStripe'
        : null

  return (
    <p
      className={cn(
        'rounded-md border border-border-default bg-muted/30 px-4 py-3 text-sm text-text-primary',
        className,
      )}
    >
      {shellT(lang, 'billingPaymentMethodBanner', { provider: me.billing_provider_label.trim() })}
      {transitionKey ? (
        <span className="mt-1 block text-text-tertiary">{shellT(lang, transitionKey)}</span>
      ) : null}
    </p>
  )
}
