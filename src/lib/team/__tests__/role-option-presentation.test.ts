import { describe, expect, it } from 'vitest'

import { roleOptionPresentation } from '@/lib/team/role-option-presentation'
import type { WorkspaceRole } from '@/lib/types/team-types'

const base: WorkspaceRole = {
  id: 'r',
  slug: 'x',
  name: 'X',
  description: null,
  system_key: null,
  permissions: [],
  member_count: 0,
  invitation_count: 0,
}

describe('role-option-presentation', () => {
  it('maps system roles to icons and copy keys', () => {
    expect(roleOptionPresentation({ ...base, system_key: 'owner' })).toEqual({
      icon: 'company',
      descriptionKey: 'teamRoleOwnerDescription',
    })
    expect(roleOptionPresentation({ ...base, system_key: 'admin' }).icon).toBe('orgs')
    expect(roleOptionPresentation({ ...base, system_key: 'staff' }).icon).toBe('user')
  })

  it('uses stored custom description when present', () => {
    const visual = roleOptionPresentation({
      ...base,
      description: 'Solo reportes',
      system_key: null,
    })
    expect(visual.icon).toBe('config')
    expect(visual.descriptionKey).toBeNull()
  })
})
