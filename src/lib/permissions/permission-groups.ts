import type { AssignablePermissionKey } from '@/lib/permissions/can'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { MODULES } from '@/lib/modules/registry'
import type { ModuleId } from '@/lib/modules/types'
import { PERMISSION_LABEL_KEYS } from '@/lib/permissions/permission-labels'

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
  | 'billing'
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
    actionKeys: ['pnl_labels.view', 'pnl_labels.manage'],
  },
  {
    id: 'alerts',
    titleKey: 'permGroupAlerts',
    viewKey: 'alerts.view',
    actionKeys: ['alerts.manage'],
  },
  {
    id: 'billing',
    titleKey: 'permGroupBilling',
    viewKey: 'billing.view',
    actionKeys: [],
  },
  {
    id: 'team',
    titleKey: 'permGroupTeam',
    viewKey: 'team.view',
    actionKeys: ['team.manage'],
  },
] as const

/** FX rates are system-managed; keep keys in the API catalog but hide them in the role wizard. */
export const HIDDEN_ASSIGNABLE_PERMISSION_KEYS = ['fx.view', 'fx.manage'] as const

const GROUP_MODULE_ID: Partial<Record<PermissionGroupId, ModuleId>> = {
  products: 'products',
  sales: 'sales',
  reports: 'reports',
  channels: 'channels',
  expenses: 'expenses',
  ads: 'ads',
  simulations: 'simulations',
  integrations: 'integrations',
  workspace_config: 'workspace-config',
  alerts: 'alarms',
}

const COMING_SOON_MODULE_IDS = new Set(
  MODULES.filter((mod) => mod.comingSoon).map((mod) => mod.id),
)

export function visiblePermissionGroups(
  enabledModuleIds: readonly string[],
): PermissionGroup[] {
  const enabled = new Set(enabledModuleIds)
  return PERMISSION_GROUPS.filter((group) => {
    const moduleId = GROUP_MODULE_ID[group.id]
    if (moduleId == null) return true
    if (COMING_SOON_MODULE_IDS.has(moduleId)) return false
    return enabled.has(moduleId)
  })
}

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
  if (key === 'pnl_labels.manage' && !current.includes('pnl_labels.view')) {
    extras.push('pnl_labels.view')
  }
  if (current.includes(key) && extras.length === 0) return current
  return [...current, ...extras.filter((item) => !current.includes(item)), ...(current.includes(key) ? [] : [key])]
}

export type AssignedGroupSummary = {
  titleKey: ShellStringKey
  actionLabels: ShellStringKey[]
}

export type PermissionHierarchyAction = {
  labelKey: ShellStringKey
  granted: boolean
}

export type PermissionHierarchyGroup = {
  titleKey: ShellStringKey
  granted: boolean
  actions: PermissionHierarchyAction[]
}

export function assignedPermissionSummary(
  keys: readonly string[],
  groups: readonly PermissionGroup[],
): AssignedGroupSummary[] {
  const selected = new Set(keys)
  const summaries: AssignedGroupSummary[] = []
  for (const group of groups) {
    if (!selected.has(group.viewKey)) continue
    const actionLabels = group.actionKeys
      .filter((key) => selected.has(key))
      .map((key) => PERMISSION_LABEL_KEYS[key])
    summaries.push({
      titleKey: group.titleKey,
      actionLabels:
        actionLabels.length > 0 ? actionLabels : [PERMISSION_LABEL_KEYS[group.viewKey]],
    })
  }
  return summaries
}

export function permissionHierarchy(
  keys: readonly string[],
  groups: readonly PermissionGroup[],
): PermissionHierarchyGroup[] {
  const selected = new Set(keys)
  return groups.map((group) => ({
    titleKey: group.titleKey,
    granted: selected.has(group.viewKey),
    actions: [
      {
        labelKey: PERMISSION_LABEL_KEYS[group.viewKey],
        granted: selected.has(group.viewKey),
      },
      ...group.actionKeys.map((key) => ({
        labelKey: PERMISSION_LABEL_KEYS[key],
        granted: selected.has(key),
      })),
    ],
  }))
}
