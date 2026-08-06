import { describe, expect, it } from 'vitest'

import {
  checkoutPlanForCta,
  isBillingOwner,
  isPlanLimitSyncPaused,
  upgradeLabelForCta,
  upgradeMailtoForCta,
} from '@/lib/plan/plan-limit-ui'
import type { MeResponse } from '@/lib/types/me-types'

const baseMe: MeResponse = {
  tenant_id: 't',
  tenant_name: 'Nomuk',
  plan: 'basic',
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
  plan_display_name: 'Basic',
  orders_used: 0,
  orders_limit: 1000,
  skus_used: 0,
  skus_limit: 500,
  sync_paused: false,
  sync_paused_reason: null,
  upgrade_cta: 'growth',
  signup_intent: 'trial',
  payment_required: false,
}

describe('plan-limit-ui', () => {
  it('checkoutPlanForCta returns growth for growth cta', () => {
    expect(checkoutPlanForCta('growth')).toBe('growth')
  })

  it('checkoutPlanForCta returns null for enterprise', () => {
    expect(checkoutPlanForCta('enterprise')).toBeNull()
  })

  it('upgradeMailtoForCta returns enterprise mailto only', () => {
    expect(upgradeMailtoForCta('enterprise')).toContain('Enterprise')
    expect(upgradeMailtoForCta('growth')).toBeNull()
  })

  it('upgradeLabelForCta returns translated growth label', () => {
    expect(upgradeLabelForCta('growth', 'en')).toContain('Growth')
  })

  it('isBillingOwner true for owner role', () => {
    expect(isBillingOwner(baseMe)).toBe(true)
    expect(isBillingOwner({ ...baseMe, role: 'admin' })).toBe(false)
  })

  it('upgradeMailtoForCta returns null for none', () => {
    expect(upgradeMailtoForCta('none')).toBeNull()
  })

  describe('isPlanLimitSyncPaused', () => {
    it('returns true when sync paused for orders_limit', () => {
      expect(
        isPlanLimitSyncPaused({
          ...baseMe,
          sync_paused: true,
          sync_paused_reason: 'orders_limit',
        }),
      ).toBe(true)
    })

    it('returns true when sync paused for skus_limit', () => {
      expect(
        isPlanLimitSyncPaused({
          ...baseMe,
          sync_paused: true,
          sync_paused_reason: 'skus_limit',
        }),
      ).toBe(true)
    })

    it('returns false when sync paused for trial_expired', () => {
      expect(
        isPlanLimitSyncPaused({
          ...baseMe,
          sync_paused: true,
          sync_paused_reason: 'trial_expired',
        }),
      ).toBe(false)
    })

    it('returns false when sync is not paused', () => {
      expect(isPlanLimitSyncPaused(baseMe)).toBe(false)
    })

    it('returns false when me is null', () => {
      expect(isPlanLimitSyncPaused(null)).toBe(false)
    })
  })
})
