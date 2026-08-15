import { describe, expect, it } from 'vitest'

import {
  billingCatalogDescription,
  billingCatalogPrice,
  billingPlanDetailLine,
  billingPlanHeadline,
  checkoutPlanForTarget,
  isBillingOwner,
  isPlanLimitSyncPaused,
  planSummaryLabel,
  upgradeLabelForTarget,
  upgradeMailtoForTarget,
  upgradeTargetForPlan,
  formatTrialEndDate,
  trialEndsOnLabel,
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
  it('upgradeTargetForPlan maps trial basic growth and hides enterprise', () => {
    expect(upgradeTargetForPlan('trial')).toBe('basic')
    expect(upgradeTargetForPlan('basic')).toBe('growth')
    expect(upgradeTargetForPlan('growth')).toBe('enterprise')
    expect(upgradeTargetForPlan('enterprise')).toBeNull()
  })

  it('checkoutPlanForTarget returns stripe plans only', () => {
    expect(checkoutPlanForTarget('basic')).toBe('basic')
    expect(checkoutPlanForTarget('growth')).toBe('growth')
    expect(checkoutPlanForTarget('enterprise')).toBeNull()
  })

  it('upgradeMailtoForTarget returns enterprise mailto only', () => {
    expect(upgradeMailtoForTarget('enterprise')).toContain('Enterprise')
    expect(upgradeMailtoForTarget('growth')).toBeNull()
  })

  it('upgradeLabelForTarget follows the current plan', () => {
    expect(upgradeLabelForTarget('basic', 'es')).toBe('Mejorar a Basic')
    expect(upgradeLabelForTarget('growth', 'es')).toBe('Mejorar a Growth')
    expect(upgradeLabelForTarget('enterprise', 'es')).toBe('Contratar Enterprise')
    expect(upgradeLabelForTarget(null, 'es')).toBeNull()
  })

  it('planSummaryLabel clarifies Basic free trial', () => {
    const label = planSummaryLabel(
      {
        ...baseMe,
        plan: 'trial',
        trial_ends_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      'es',
    )
    expect(label).toMatch(/Basic/)
    expect(label).toMatch(/prueba gratuita/)
  })


  it('trialEndsOnLabel includes formatted end date for trial', () => {
    const label = trialEndsOnLabel(
      { ...baseMe, plan: 'trial', trial_ends_at: '2026-08-26T23:59:59.000Z' },
      'es',
    )
    expect(label).toMatch(/Termina el/)
    expect(formatTrialEndDate('2026-08-26T23:59:59.000Z', 'en')).toMatch(/2026/)
  })

  it('trialEndsOnLabel returns null for non-trial', () => {
    expect(trialEndsOnLabel(baseMe, 'es')).toBeNull()
  })

  it('billingCatalogPrice and description match subscribed plans', () => {
    expect(billingCatalogPrice('basic', 'en')).toMatch(/\$30/)
    expect(billingCatalogPrice('growth', 'en')).toMatch(/\$60/)
    expect(billingCatalogDescription('basic', 'es')).toMatch(/1,000/)
  })

  it('billingPlanHeadline and detail use two-line trial copy', () => {
    const trialMe = {
      ...baseMe,
      plan: 'trial',
      trial_ends_at: '2026-08-26T23:59:59.000Z',
    }
    expect(billingPlanHeadline(trialMe, 'es')).toBe('Basic Plan - Prueba Gratuita')
    expect(billingPlanDetailLine(trialMe, 'es')).toMatch(/días restantes\. Termina el/)
  })

  it('isBillingOwner true for is_owner', () => {
    expect(isBillingOwner(baseMe)).toBe(false)
    expect(isBillingOwner({ ...baseMe, is_owner: true })).toBe(true)
    expect(isBillingOwner({ ...baseMe, role: 'admin', is_owner: false })).toBe(false)
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
