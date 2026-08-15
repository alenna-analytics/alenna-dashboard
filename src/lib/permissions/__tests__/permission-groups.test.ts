import { describe, expect, it } from 'vitest'

import { toggleGroupView, PERMISSION_GROUPS, visiblePermissionGroups } from '@/lib/permissions/permission-groups'
import { shouldShowCustomRolesUpgrade } from '@/pages/team/team-roles-paywall'

describe('permission-groups overlay preview', () => {
  it('has a team group for the Basic paywall preview', () => {
    expect(PERMISSION_GROUPS.some((g) => g.id === 'team')).toBe(true)
    const team = PERMISSION_GROUPS.find((g) => g.id === 'team')!
    expect(toggleGroupView([], team, true)).toEqual(['team.view'])
  })

  it('shows Growth overlay for Owner without custom roles', () => {
    expect(shouldShowCustomRolesUpgrade(true, false)).toBe(true)
    expect(shouldShowCustomRolesUpgrade(true, true)).toBe(false)
    expect(shouldShowCustomRolesUpgrade(false, false)).toBe(false)
  })

  it('hides coming-soon modules and keeps Equipo', () => {
    const groups = visiblePermissionGroups(['products', 'ads', 'simulations', 'alarms'])
    const ids = groups.map((g) => g.id)
    expect(ids).toContain('products')
    expect(ids).toContain('alerts')
    expect(ids).toContain('team')
    expect(ids).not.toContain('ads')
    expect(ids).not.toContain('simulations')
    expect(ids).not.toContain('expenses')
  })
})
