import type { AppIconName } from '@/lib/icons/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ModuleId } from '@/lib/modules/types'

export type WorkspaceConfigSubmoduleId = 'general' | 'alarms' | 'pnl-terms'

export type WorkspaceConfigSubmodule = {
  id: WorkspaceConfigSubmoduleId
  labelKey: ShellStringKey
  descriptionKey: ShellStringKey
  path: string
  icon: AppIconName
  requiredModuleId: ModuleId
}

export const WORKSPACE_CONFIG_SUBMODULES: readonly WorkspaceConfigSubmodule[] = [
  {
    id: 'general',
    labelKey: 'navGeneral',
    descriptionKey: 'workspaceConfigGeneralDescription',
    path: '/dashboard/configuration/general',
    icon: 'company',
    requiredModuleId: 'workspace-config',
  },
  {
    id: 'alarms',
    labelKey: 'navAlarms',
    descriptionKey: 'workspaceConfigAlarmsDescription',
    path: '/dashboard/configuration/alarms',
    icon: 'notifications',
    requiredModuleId: 'alarms',
  },
  {
    id: 'pnl-terms',
    labelKey: 'workspaceConfigPnlTermsTitle',
    descriptionKey: 'workspaceConfigPnlTermsDescription',
    path: '/dashboard/configuration/pnl-terms',
    icon: 'reports',
    requiredModuleId: 'workspace-config',
  },
] as const

export function visibleWorkspaceConfigSubmodules(
  enabledModuleIds: readonly string[],
): WorkspaceConfigSubmodule[] {
  const enabled = new Set(enabledModuleIds)
  const workspaceEnabled = enabled.has('workspace-config')
  return WORKSPACE_CONFIG_SUBMODULES.filter((submodule) => {
    if (!enabled.has(submodule.requiredModuleId)) return false
    if (submodule.id === 'alarms') return true
    return workspaceEnabled
  })
}

export function shouldShowWorkspaceConfigNav(enabledModuleIds: readonly string[]): boolean {
  return visibleWorkspaceConfigSubmodules(enabledModuleIds).length > 0
}

export function isWorkspaceConfigSubmoduleId(
  value: string,
): value is WorkspaceConfigSubmoduleId {
  return value === 'general' || value === 'alarms' || value === 'pnl-terms'
}
