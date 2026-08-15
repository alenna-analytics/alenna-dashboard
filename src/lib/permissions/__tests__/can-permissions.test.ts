import { describe, expect, it } from 'vitest'

import {
  ASSIGNABLE_PERMISSION_KEYS,
  can,
  hasModule,
  isOwner,
} from '@/lib/permissions/can'
import {
  PERMISSION_GROUPS,
  toggleGroupAction,
  toggleGroupView,
} from '@/lib/permissions/permission-groups'
import type { MeResponse } from '@/lib/types/me-types'

const FROZEN_API_KEYS = [
  'ads.view',
  'alerts.manage',
  'alerts.view',
  'channels.view',
  'expenses.create',
  'expenses.delete',
  'expenses.edit',
  'expenses.view',
  'fx.manage',
  'fx.view',
  'integrations.manage',
  'integrations.view',
  'pnl_labels.manage',
  'pnl_labels.view',
  'products.edit',
  'products.view',
  'reports.view',
  'sales.view',
  'simulations.view',
  'team.manage',
  'team.view',
  'workspace_config.view',
] as const

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
    expect(can(owner, 'account.deletion')).toBe(true)
  })

  it('admin uses assigned keys only', () => {
    expect(can(baseMe, 'alerts.manage')).toBe(true)
    expect(can(baseMe, 'integrations.manage')).toBe(false)
    expect(isOwner(baseMe)).toBe(false)
  })

  it('assignable keys match API frozen list', () => {
    expect([...ASSIGNABLE_PERMISSION_KEYS]).toEqual([...FROZEN_API_KEYS])
  })

  it('toggling view off strips actions', () => {
    const products = PERMISSION_GROUPS.find((g) => g.id === 'products')!
    const next = toggleGroupView(['products.view', 'products.edit'], products, false)
    expect(next).toEqual([])
  })

  it('toggling edit without view adds view', () => {
    const products = PERMISSION_GROUPS.find((g) => g.id === 'products')!
    const next = toggleGroupAction([], products, 'products.edit', true)
    expect(next).toEqual(expect.arrayContaining(['products.view', 'products.edit']))
  })

  it('groups cover every assignable key', () => {
    const grouped = PERMISSION_GROUPS.flatMap((group) => [group.viewKey, ...group.actionKeys])
    expect([...new Set(grouped)].sort()).toEqual([...ASSIGNABLE_PERMISSION_KEYS])
  })

  it('hasModule follows me.modules', () => {
    expect(hasModule(baseMe, 'products')).toBe(false)
    expect(hasModule({ ...baseMe, modules: ['products'] }, 'products')).toBe(true)
  })
})
