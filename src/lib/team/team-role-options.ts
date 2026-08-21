import type { WorkspaceRole } from '@/lib/types/team-types'

const SYSTEM_ROLE_LIST_RANK: Record<string, number> = {
  owner: 0,
  admin: 1,
  staff: 2,
}

export function sortWorkspaceRoles(roles: WorkspaceRole[]): WorkspaceRole[] {
  return [...roles].sort((left, right) => {
    const leftRank = SYSTEM_ROLE_LIST_RANK[left.system_key ?? ''] ?? 3
    const rightRank = SYSTEM_ROLE_LIST_RANK[right.system_key ?? ''] ?? 3
    if (leftRank !== rightRank) return leftRank - rightRank
    return left.name.localeCompare(right.name)
  })
}

export function selectableWorkspaceRoles(
  roles: WorkspaceRole[],
  options: { isOwner: boolean; lockToOwner: boolean },
): WorkspaceRole[] {
  if (options.lockToOwner) {
    return sortWorkspaceRoles(roles.filter((role) => role.system_key === 'owner'))
  }
  return sortWorkspaceRoles(
    roles.filter((role) => {
      if (role.system_key === 'owner' && !options.isOwner) return false
      return true
    }),
  )
}

export function defaultInviteRoleId(roles: WorkspaceRole[], isOwner: boolean): string {
  const allowed = selectableWorkspaceRoles(roles, { isOwner, lockToOwner: false })
  const admin = allowed.find((role) => role.system_key === 'admin')
  if (admin) return admin.id
  const staff = allowed.find((role) => role.system_key === 'staff')
  if (staff) return staff.id
  return allowed[0]?.id ?? ''
}
