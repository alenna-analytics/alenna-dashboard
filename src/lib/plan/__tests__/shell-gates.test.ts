import { describe, expect, it } from 'vitest'

import { shouldShowPaymentPending, shouldShowTrialExpired } from '@/lib/plan/shell-gates'
import type { MeResponse } from '@/lib/types/me-types'

const baseMe: MeResponse = {
  tenant_id: 't',
  tenant_name: 'Nomuk',
  plan: 'trial',
  modules: [],
  trial_ends_at: null,
  trial_expired: false,
  user_id: 'u',
  clerk_user_id: 'c',
  email: 'a@b.com',
  first_name: 'A',
  last_name: 'B',
  role: 'owner',
  role_name: 'Owner',
  base_currency: 'MXN',
  display_currency: null,
  latest_fx_for_display: null,
  signup_intent: 'trial',
  payment_required: false,
}

describe('shell-gates', () => {
  it('payment_required wins over trial_expired', () => {
    const me: MeResponse = {
      ...baseMe,
      payment_required: true,
      trial_expired: true,
      signup_intent: 'trial',
    }
    expect(shouldShowPaymentPending(me)).toBe(true)
    expect(shouldShowTrialExpired(me, false)).toBe(false)
  })

  it('paymentForced shows payment pending', () => {
    expect(shouldShowPaymentPending(baseMe, true)).toBe(true)
  })

  it('growth signup with trial_expired does not show TrialExpiredScreen', () => {
    const me: MeResponse = {
      ...baseMe,
      trial_expired: true,
      signup_intent: 'growth',
    }
    expect(shouldShowTrialExpired(me, false)).toBe(false)
  })

  it('trial signup with trial_expired shows TrialExpiredScreen', () => {
    const me: MeResponse = {
      ...baseMe,
      trial_expired: true,
      signup_intent: 'trial',
    }
    expect(shouldShowTrialExpired(me, false)).toBe(true)
  })

  it('trialForced shows trial expired even for growth intent', () => {
    const me: MeResponse = {
      ...baseMe,
      signup_intent: 'growth',
    }
    expect(shouldShowTrialExpired(me, true)).toBe(true)
  })
})
