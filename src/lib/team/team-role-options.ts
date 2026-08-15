import type { WorkspaceRole } from '@/lib/types/team-types'

export function selectableWorkspaceRoles(
  roles: WorkspaceRole[],
  options: { isOwner: boolean; lockToOwner: boolean },
): WorkspaceRole[] {
  if (options.lockToOwner) {
    return roles.filter((role) => role.system_key === 'owner')
  }
  return roles.filter((role) => {
    if (role.system_key === 'owner' && !options.isOwner) return false
    return true
  })
}

export function defaultInviteRoleId(roles: WorkspaceRole[], isOwner: boolean): string {
  const allowed = selectableWorkspaceRoles(roles, { isOwner, lockToOwner: false })
  const admin = allowed.find((role) => role.system_key === 'admin')
  if (admin) return admin.id
  const staff = allowed.find((role) => role.system_key === 'staff')
  if (staff) return staff.id
  return allowed[0]?.id ?? ''
}
