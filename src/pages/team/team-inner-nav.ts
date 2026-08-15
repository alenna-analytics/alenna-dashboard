import type { ShellStringKey } from '@/lib/i18n/shell-strings'

export const TEAM_BASE_PATH = '/dashboard/team'
export const TEAM_ROLES_PATH = `${TEAM_BASE_PATH}/roles`

export type TeamNavItemId = 'members' | 'roles'

export type TeamNavItem = {
  id: TeamNavItemId
  path: string
  labelKey: ShellStringKey
}

export const TEAM_INNER_NAV: TeamNavItem[] = [
  { id: 'members', path: TEAM_BASE_PATH, labelKey: 'teamNavMembers' },
  { id: 'roles', path: TEAM_ROLES_PATH, labelKey: 'teamNavRoles' },
]

export function isTeamRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/'
  return normalized === TEAM_BASE_PATH || normalized.startsWith(`${TEAM_BASE_PATH}/`)
}

export function isTeamNavItemActive(item: TeamNavItem, pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/'
  if (item.id === 'members') return normalized === TEAM_BASE_PATH
  return normalized === item.path || normalized.startsWith(`${item.path}/`)
}
