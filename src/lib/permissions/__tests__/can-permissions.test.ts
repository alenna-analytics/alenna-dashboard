import { describe, expect, it } from 'vitest'

import { can, isOwner } from '@/lib/permissions/can'
import type { MeResponse } from '@/lib/types/me-types'

const baseMe: MeResponse = {
  tenant_id: 't',
  tenant_name: 'Nomuk',
  plan: 'growth',
  modules: [],
  trial_ends_at: null,
  trial_expired: false,
  user_id: 'u',
  clerk_user_id: 'c',
  email: 'a@b.com',
  first_name: 'A',
  last_name: 'B',
  role: 'admin',
  role_name: 'Admin',
  permissions: ['alerts.manage'],
  is_owner: false,
  can_manage_roles: false,
  base_currency: 'MXN',
  display_currency: null,
  latest_fx_for_display: null,
  signup_intent: 'trial',
  payment_required: false,
}

describe('can-permissions', () => {
  it('owner has every permission', () => {
    const owner = { ...baseMe, role: 'owner', role_name: 'Owner', is_owner: true, permissions: [] }
    expect(isOwner(owner)).toBe(true)
    expect(can(owner, 'billing.manage')).toBe(true)
    expect(can(owner, 'roles.manage')).toBe(true)
  })

  it('admin uses assigned keys only', () => {
    expect(can(baseMe, 'alerts.manage')).toBe(true)
    expect(can(baseMe, 'integrations.manage')).toBe(false)
    expect(isOwner(baseMe)).toBe(false)
  })
})
