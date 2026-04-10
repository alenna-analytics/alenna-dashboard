import { createContext, useContext, type ReactNode } from 'react'

import type { MeResponse } from '@/lib/me-types'

type WorkspaceContextValue = {
  me: MeResponse | null
  refetchMe: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({
  value,
  children,
}: {
  value: WorkspaceContextValue
  children: ReactNode
}) {
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is paired with provider
export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return ctx
}
