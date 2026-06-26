import type { AppIconName } from '@/lib/icons/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ModuleId } from '@/lib/modules/types'

export type WorkspaceConfigSubmoduleId = 'general' | 'alarms'

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
] as const

export function isWorkspaceConfigSubmoduleId(
  value: string,
): value is WorkspaceConfigSubmoduleId {
  return value === 'general' || value === 'alarms'
}
