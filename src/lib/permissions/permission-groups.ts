import type { AssignablePermissionKey } from '@/lib/permissions/can'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'

export type PermissionGroupId =
  | 'products'
  | 'sales'
  | 'reports'
  | 'channels'
  | 'expenses'
  | 'ads'
  | 'simulations'
  | 'integrations'
  | 'workspace_config'
  | 'alerts'
  | 'team'

export type PermissionGroup = {
  id: PermissionGroupId
  titleKey: ShellStringKey
  viewKey: AssignablePermissionKey
  actionKeys: readonly AssignablePermissionKey[]
}

export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  {
    id: 'products',
    titleKey: 'permGroupProducts',
    viewKey: 'products.view',
    actionKeys: ['products.edit'],
  },
  {
    id: 'sales',
    titleKey: 'permGroupSales',
    viewKey: 'sales.view',
    actionKeys: [],
  },
  {
    id: 'reports',
    titleKey: 'permGroupReports',
    viewKey: 'reports.view',
    actionKeys: [],
  },
  {
    id: 'channels',
    titleKey: 'permGroupChannels',
    viewKey: 'channels.view',
    actionKeys: [],
  },
  {
    id: 'expenses',
    titleKey: 'permGroupExpenses',
    viewKey: 'expenses.view',
    actionKeys: ['expenses.create', 'expenses.edit', 'expenses.delete'],
  },
  {
    id: 'ads',
    titleKey: 'permGroupAds',
    viewKey: 'ads.view',
    actionKeys: [],
  },
  {
    id: 'simulations',
    titleKey: 'permGroupSimulations',
    viewKey: 'simulations.view',
    actionKeys: [],
  },
  {
    id: 'integrations',
    titleKey: 'permGroupIntegrations',
    viewKey: 'integrations.view',
    actionKeys: ['integrations.manage'],
  },
  {
    id: 'workspace_config',
    titleKey: 'permGroupWorkspaceConfig',
    viewKey: 'workspace_config.view',
    actionKeys: ['fx.view', 'fx.manage', 'pnl_labels.view', 'pnl_labels.manage'],
  },
  {
    id: 'alerts',
    titleKey: 'permGroupAlerts',
    viewKey: 'alerts.view',
    actionKeys: ['alerts.manage'],
  },
  {
    id: 'team',
    titleKey: 'permGroupTeam',
    viewKey: 'team.view',
    actionKeys: ['team.manage'],
  },
] as const

export function toggleGroupView(
  current: string[],
  group: PermissionGroup,
  enabled: boolean,
): string[] {
  const drop = new Set<string>([group.viewKey, ...group.actionKeys])
  const without = current.filter((key) => !drop.has(key))
  if (!enabled) return without
  return [...without, group.viewKey]
}

export function toggleGroupAction(
  current: string[],
  group: PermissionGroup,
  key: AssignablePermissionKey,
  enabled: boolean,
): string[] {
  if (!enabled) return current.filter((item) => item !== key)
  const extras: string[] = []
  if (!current.includes(group.viewKey)) extras.push(group.viewKey)
  if (key === 'fx.manage' && !current.includes('fx.view')) extras.push('fx.view')
  if (key === 'pnl_labels.manage' && !current.includes('pnl_labels.view')) {
    extras.push('pnl_labels.view')
  }
  if (current.includes(key) && extras.length === 0) return current
  return [...current, ...extras.filter((item) => !current.includes(item)), ...(current.includes(key) ? [] : [key])]
}
