import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { TeamRoleSlug } from '@/lib/types/team-types'

export type TeamRoleOption = {
  id: TeamRoleSlug
  titleKey: ShellStringKey
  descriptionKey: ShellStringKey
}

export const TEAM_ROLE_OPTIONS: TeamRoleOption[] = [
  {
    id: 'owner',
    titleKey: 'teamRoleOwnerTitle',
    descriptionKey: 'teamRoleOwnerDescription',
  },
  {
    id: 'admin',
    titleKey: 'teamRoleAdminTitle',
    descriptionKey: 'teamRoleAdminDescription',
  },
  {
    id: 'staff',
    titleKey: 'teamRoleStaffTitle',
    descriptionKey: 'teamRoleStaffDescription',
  },
]

export function selectableTeamRoles(actorRole: string): TeamRoleSlug[] {
  const normalized = actorRole.trim().toLowerCase()
  if (normalized === 'owner') return ['owner', 'admin', 'staff']
  if (normalized === 'admin') return ['admin', 'staff']
  return ['staff']
}
