import { useMemo } from 'react'

import { MODULES } from '@/lib/modules/registry'
import type { ModuleId, ModuleState } from '@/lib/modules/types'
import { WORKSPACE_CONFIG_SUBMODULES } from '@/lib/modules/workspace-config-submodules'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { parseModuleIds } from '@/lib/modules/types'

export function useEnabledWorkspaceConfigSubmodules() {
  const { me } = useWorkspace()
  const enabledSet = useMemo(
    () => new Set(parseModuleIds(me?.modules ?? [])),
    [me?.modules],
  )
  const workspaceEnabled = enabledSet.has('workspace-config')

  return useMemo(
    () =>
      WORKSPACE_CONFIG_SUBMODULES.filter(
        (submodule) => workspaceEnabled && enabledSet.has(submodule.requiredModuleId),
      ),
    [enabledSet, workspaceEnabled],
  )
}

export function useConfigSectionModules(): ModuleState[] {
  const { me } = useWorkspace()
  const enabledSet = useMemo(
    () => new Set(parseModuleIds(me?.modules ?? [])),
    [me?.modules],
  )

  return useMemo(
    () =>
      MODULES.filter(
        (def) =>
          def.section === 'config' &&
          def.id !== 'workspace-config' &&
          enabledSet.has(def.id as ModuleId),
      ).map((def) => ({
        ...def,
        enabled: true,
      })),
    [enabledSet],
  )
}

export function useWorkspaceConfigModuleEnabled(): boolean {
  const { me } = useWorkspace()
  const enabledSet = useMemo(
    () => new Set(parseModuleIds(me?.modules ?? [])),
    [me?.modules],
  )
  return enabledSet.has('workspace-config')
}
