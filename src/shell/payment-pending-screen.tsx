import { UserButton } from '@clerk/react'

import { StripeCheckoutButton } from '@/components/billing/stripe-checkout-button'
import { paymentPendingCancelUrl } from '@/lib/billing/billing-api'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'

export function PaymentPendingScreen() {
  const { lang } = useLanguage()
  const t = (key: ShellStringKey) => shellT(lang, key)

  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--bg-base)] p-6">
      <div className="w-full max-w-md rounded-md border border-[var(--shell-structure-border)] bg-white p-8 text-center shadow-[var(--shadow-ink-sm)]">
        <h1 className="text-xl font-semibold text-text-primary">{t('paymentPendingTitle')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{t('paymentPendingBody')}</p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <StripeCheckoutButton
            plan="growth"
            label={t('paymentPendingCta')}
            variant="primary"
            checkoutOptions={{ cancelUrl: paymentPendingCancelUrl() }}
          />
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>{t('paymentPendingSignOut')}</span>
            <UserButton />
          </div>
        </div>
      </div>
    </div>
  )
}
