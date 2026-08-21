import { useMemo } from 'react'

import { MODULES } from '@/lib/modules/registry'
import type { ModuleId, ModuleState } from '@/lib/modules/types'
import { parseModuleIds } from '@/lib/modules/types'
import {
  shouldShowWorkspaceConfigNav,
  visibleWorkspaceConfigSubmodules,
} from '@/lib/modules/workspace-config-submodules'
import { useWorkspace } from '@/shell/providers/workspace-context'

export function useEnabledWorkspaceConfigSubmodules() {
  const { me } = useWorkspace()
  const moduleIds = useMemo(
    () => parseModuleIds(me?.modules ?? []),
    [me?.modules],
  )

  return useMemo(() => visibleWorkspaceConfigSubmodules(moduleIds), [moduleIds])
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

export function useWorkspaceConfigNavEnabled(): boolean {
  const { me } = useWorkspace()
  const moduleIds = useMemo(
    () => parseModuleIds(me?.modules ?? []),
    [me?.modules],
  )
  return shouldShowWorkspaceConfigNav(moduleIds)
}
