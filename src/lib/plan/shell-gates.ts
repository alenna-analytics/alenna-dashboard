import type { MeResponse } from '@/lib/types/me-types'

export function shouldShowPaymentPending(
  me: MeResponse | null | undefined,
  paymentForced = false,
): boolean {
  if (me?.account_deletion_status === 'pending') return false
  if (me?.payment_required || paymentForced) return true
  return false
}

export function shouldShowTrialExpired(
  me: MeResponse | null | undefined,
  trialForced: boolean,
): boolean {
  if (me?.payment_required) return false
  if (me?.account_deletion_status === 'pending') return false
  if (trialForced) return true
  if (!me?.trial_expired) return false
  return me.signup_intent === 'trial'
}
