import { useMemo } from 'react'

import { MODULES } from '@/lib/modules/registry'
import type { ModuleId, ModuleState } from '@/lib/modules/types'
import { parseModuleIds } from '@/lib/modules/types'
import { useWorkspace } from '@/shell/providers/workspace-context'

export function useModules(): ModuleState[] {
  const { me } = useWorkspace()
  const enabledSet = useMemo(
    () => new Set(parseModuleIds(me?.modules ?? [])),
    [me?.modules],
  )

  return useMemo(
    () =>
      MODULES.map((def) => ({
        ...def,
        enabled: enabledSet.has(def.id),
      })),
    [enabledSet],
  )
}

export function useModule(id: ModuleId): ModuleState | undefined {
  const modules = useModules()
  return modules.find((m) => m.id === id)
}

export function useEnabledModules(): ModuleState[] {
  return useModules().filter((m) => m.enabled)
}
