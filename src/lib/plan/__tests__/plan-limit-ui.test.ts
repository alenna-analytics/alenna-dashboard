import { describe, expect, it } from 'vitest'

import {
  isPlanLimitSyncPaused,
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
}

describe('plan-limit-ui', () => {
  it('upgradeMailtoForCta returns growth mailto', () => {
    expect(upgradeMailtoForCta('growth')).toContain('Growth')
  })

  it('upgradeMailtoForCta returns contact mailto', () => {
    expect(upgradeMailtoForCta('contact')).toContain('mailto:')
  })

  it('isPlanLimitSyncPaused ignores trial_expired', () => {
    expect(
      isPlanLimitSyncPaused({
        ...baseMe,
        sync_paused: true,
        sync_paused_reason: 'trial_expired',
      }),
    ).toBe(false)
  })

  it('isPlanLimitSyncPaused true for orders_limit', () => {
    expect(
      isPlanLimitSyncPaused({
        ...baseMe,
        sync_paused: true,
        sync_paused_reason: 'orders_limit',
      }),
    ).toBe(true)
  })

  it('upgradeMailtoForCta returns null for none', () => {
    expect(upgradeMailtoForCta('none')).toBeNull()
  })
})
