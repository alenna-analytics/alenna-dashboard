import { Navigate } from 'react-router-dom'

import { useEnabledWorkspaceConfigSubmodules } from '@/lib/modules/use-workspace-config'

export function ConfigurationIndexRedirect() {
  const submodules = useEnabledWorkspaceConfigSubmodules()
  const target = submodules[0]?.path

  if (!target) {
    return <Navigate to="/dashboard" replace />
  }

  return <Navigate to={target} replace />
}
