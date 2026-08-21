import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import type { ModuleId } from '@/lib/modules/types'
import { can, hasModule } from '@/lib/permissions/can'
import { useWorkspace } from '@/shell/providers/workspace-context'

type RequireModuleProps = {
  moduleId?: ModuleId
  anyModuleIds?: readonly ModuleId[]
  permission?: string
  children: ReactNode
}

export function RequireModule({ moduleId, anyModuleIds, permission, children }: RequireModuleProps) {
  const { me } = useWorkspace()
  if (permission && !can(me, permission)) {
    return <Navigate to="/dashboard" replace />
  }
  if (moduleId && !hasModule(me, moduleId)) {
    return <Navigate to="/dashboard" replace />
  }
  if (anyModuleIds && !anyModuleIds.some((id) => hasModule(me, id))) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
