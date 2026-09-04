import { describe, expect, it } from 'vitest'

import type { MeResponse } from '@/lib/types/me-types'
import {
  matchSuggestionIdFromPayload,
  resolveHomePermissionFlags,
} from '@/pages/dashboard/home-permission-flags'

function meWith(permissions: string[]): MeResponse {
  return {
    tenant_id: 't1',
    tenant_name: 'T',
    plan: 'growth',
    modules: [],
    trial_ends_at: null,
    trial_expired: false,
    user_id: 'u1',
    clerk_user_id: 'c1',
    email: 'a@b.co',
    first_name: null,
    last_name: null,
    role: 'staff',
    role_name: 'Staff',
    permissions,
    is_owner: false,
    base_currency: 'MXN',
  currency: {
    multi_currency_enabled: false,
    base_currency: 'MXN',
    expense_currencies: ['MXN'],
    display_currencies: ['MXN'],
  },
    display_currency: null,
    latest_fx_for_display: null,
    signup_intent: 'trial',
    payment_required: false,
  }
}

describe('resolveHomePermissionFlags', () => {
  it('ads-only gets ads home without sales', () => {
    const flags = resolveHomePermissionFlags(meWith(['ads.view']))
    expect(flags.canAdsHome).toBe(true)
    expect(flags.canSalesHome).toBe(false)
    expect(flags.canFetchConnectors).toBe(true)
    expect(flags.hasAnyHomeWidget).toBe(true)
  })

  it('sales-only does not enable ads', () => {
    const flags = resolveHomePermissionFlags(meWith(['sales.view']))
    expect(flags.canSalesHome).toBe(true)
    expect(flags.canAdsHome).toBe(false)
  })

  it('no analytics permissions has empty home', () => {
    const flags = resolveHomePermissionFlags(meWith(['team.view']))
    expect(flags.hasAnyHomeWidget).toBe(false)
    expect(flags.canFetchConnectors).toBe(false)
  })
})

describe('matchSuggestionIdFromPayload', () => {
  it('returns valid uuid', () => {
    expect(
      matchSuggestionIdFromPayload({
        suggestion_id: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
      }),
    ).toBe('a1b2c3d4-e5f6-4789-a012-3456789abcde')
  })

  it('rejects missing or invalid', () => {
    expect(matchSuggestionIdFromPayload({})).toBeNull()
    expect(matchSuggestionIdFromPayload({ suggestion_id: 'not-a-uuid' })).toBeNull()
    expect(matchSuggestionIdFromPayload(null)).toBeNull()
  })
})
