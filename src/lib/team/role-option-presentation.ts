import type { AppIconName } from '@/lib/icons/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { WorkspaceRole } from '@/lib/types/team-types'

export type RoleOptionPresentation = {
  icon: AppIconName
  descriptionKey: ShellStringKey | null
}

export function roleOptionPresentation(role: WorkspaceRole): RoleOptionPresentation {
  if (role.system_key === 'owner') {
    return { icon: 'company', descriptionKey: 'teamRoleOwnerDescription' }
  }
  if (role.system_key === 'admin') {
    return { icon: 'orgs', descriptionKey: 'teamRoleAdminDescription' }
  }
  if (role.system_key === 'staff') {
    return { icon: 'user', descriptionKey: 'teamRoleStaffDescription' }
  }
  return { icon: 'config', descriptionKey: role.description ? null : 'teamRoleCustomDescription' }
}
