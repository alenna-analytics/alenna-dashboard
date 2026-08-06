import type { MeResponse } from '@/lib/types/me-types'

export function shouldShowPaymentPending(me: MeResponse | null | undefined): boolean {
  if (!me?.payment_required) return false
  return me.account_deletion_status !== 'pending'
}

export function shouldShowTrialExpired(
  me: MeResponse | null | undefined,
  trialForced: boolean,
): boolean {
  if (me?.payment_required) return false
  if (me?.account_deletion_status === 'pending') return false
  if (!me?.trial_expired && !trialForced) return false
  return me?.signup_intent === 'trial'
}
