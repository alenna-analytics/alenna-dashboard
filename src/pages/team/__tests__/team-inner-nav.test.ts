import { describe, expect, it } from 'vitest'

import { isTeamNavItemActive, isTeamRoute, TEAM_INNER_NAV } from '@/pages/team/team-inner-nav'

describe('team-inner-nav', () => {
  it('treats members and roles as team routes', () => {
    expect(isTeamRoute('/dashboard/team')).toBe(true)
    expect(isTeamRoute('/dashboard/team/roles')).toBe(true)
    expect(isTeamRoute('/dashboard/products')).toBe(false)
  })

  it('activates the matching inner nav item', () => {
    const members = TEAM_INNER_NAV[0]
    const roles = TEAM_INNER_NAV[1]
    expect(isTeamNavItemActive(members, '/dashboard/team')).toBe(true)
    expect(isTeamNavItemActive(members, '/dashboard/team/roles')).toBe(false)
    expect(isTeamNavItemActive(roles, '/dashboard/team/roles')).toBe(true)
  })
})
