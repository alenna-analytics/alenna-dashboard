import type { AppIconName } from '@/lib/icons/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ModuleId } from '@/lib/modules/types'

export type WorkspaceConfigSubmoduleId = 'general' | 'pnl-terms' | 'fx-rates'

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
    id: 'pnl-terms',
    labelKey: 'workspaceConfigPnlTermsTitle',
    descriptionKey: 'workspaceConfigPnlTermsDescription',
    path: '/dashboard/configuration/pnl-terms',
    icon: 'reports',
    requiredModuleId: 'workspace-config',
  },
  {
    id: 'fx-rates',
    labelKey: 'workspaceConfigFxRatesTitle',
    descriptionKey: 'workspaceConfigFxRatesDescription',
    path: '/dashboard/configuration/fx-rates',
    icon: 'billing',
    requiredModuleId: 'workspace-config',
  },
] as const

export type WorkspaceConfigVisibilityOpts = {
  multiCurrencyEnabled?: boolean
  canViewFx?: boolean
}

export function visibleWorkspaceConfigSubmodules(
  enabledModuleIds: readonly string[],
  opts: WorkspaceConfigVisibilityOpts = {},
): WorkspaceConfigSubmodule[] {
  const enabled = new Set(enabledModuleIds)
  return WORKSPACE_CONFIG_SUBMODULES.filter((submodule) => {
    if (!enabled.has(submodule.requiredModuleId)) return false
    if (submodule.id === 'fx-rates') {
      return Boolean(opts.multiCurrencyEnabled && opts.canViewFx)
    }
    return true
  })
}

export function shouldShowWorkspaceConfigNav(
  enabledModuleIds: readonly string[],
  opts: WorkspaceConfigVisibilityOpts = {},
): boolean {
  return visibleWorkspaceConfigSubmodules(enabledModuleIds, opts).length > 0
}

export function isWorkspaceConfigSubmoduleId(
  value: string,
): value is WorkspaceConfigSubmoduleId {
  return value === 'general' || value === 'pnl-terms' || value === 'fx-rates'
}
