import { describe, expect, it } from 'vitest'

import { defaultInviteRoleId, selectableWorkspaceRoles, sortWorkspaceRoles } from '@/lib/team/team-role-options'
import type { WorkspaceRole } from '@/lib/types/team-types'

const roles: WorkspaceRole[] = [
  {
    id: 'o',
    slug: 'owner',
    name: 'Owner',
    description: null,
    system_key: 'owner',
    permissions: null,
    member_count: 1,
    invitation_count: 0,
  },
  {
    id: 'a',
    slug: 'admin',
    name: 'Admin',
    description: null,
    system_key: 'admin',
    permissions: null,
    member_count: 1,
    invitation_count: 0,
  },
  {
    id: 's',
    slug: 'staff',
    name: 'Staff',
    description: null,
    system_key: 'staff',
    permissions: null,
    member_count: 1,
    invitation_count: 0,
  },
  {
    id: 'c',
    slug: 'analyst',
    name: 'Analyst',
    description: null,
    system_key: null,
    permissions: ['alerts.manage'],
    member_count: 0,
    invitation_count: 0,
  },
]

describe('team-role-options', () => {
  it('lists owner before admin and staff, then custom roles', () => {
    const shuffled = [roles[2]!, roles[3]!, roles[1]!, roles[0]!]
    expect(sortWorkspaceRoles(shuffled).map((r) => r.id)).toEqual(['o', 'a', 's', 'c'])
  })

  it('hides owner unless the actor is owner', () => {
    const forAdmin = selectableWorkspaceRoles(roles, { isOwner: false, lockToOwner: false })
    expect(forAdmin.map((r) => r.id)).toEqual(['a', 's', 'c'])
    const forOwner = selectableWorkspaceRoles(roles, { isOwner: true, lockToOwner: false })
    expect(forOwner.map((r) => r.id)).toEqual(['o', 'a', 's', 'c'])
  })

  it('locks last owner to owner only', () => {
    const locked = selectableWorkspaceRoles(roles, { isOwner: true, lockToOwner: true })
    expect(locked.map((r) => r.id)).toEqual(['o'])
  })

  it('defaults invite role to admin', () => {
    expect(defaultInviteRoleId(roles, false)).toBe('a')
  })
})
