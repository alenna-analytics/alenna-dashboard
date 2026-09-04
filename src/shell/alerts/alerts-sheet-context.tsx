import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import type { AlertKindFilter } from './alerts-filter'

export type OpenAlertsSheetOptions = {
  kind?: AlertKindFilter
}

type AlertsSheetContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  openSheet: (options?: OpenAlertsSheetOptions) => void
  /** Kind to apply when the sheet opens; consumed once by the host/sheet. */
  pendingKind: AlertKindFilter | null
  clearPendingKind: () => void
}

const AlertsSheetContext = createContext<AlertsSheetContextValue | null>(null)

export function AlertsSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pendingKind, setPendingKind] = useState<AlertKindFilter | null>(null)

  const openSheet = useCallback((options?: OpenAlertsSheetOptions) => {
    if (options?.kind) setPendingKind(options.kind)
    setOpen(true)
  }, [])

  const clearPendingKind = useCallback(() => {
    setPendingKind(null)
  }, [])

  const value = useMemo(
    () => ({
      open,
      setOpen,
      openSheet,
      pendingKind,
      clearPendingKind,
    }),
    [open, openSheet, pendingKind, clearPendingKind],
  )

  return <AlertsSheetContext.Provider value={value}>{children}</AlertsSheetContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is paired with provider
export function useAlertsSheet(): AlertsSheetContextValue {
  const ctx = useContext(AlertsSheetContext)
  if (!ctx) {
    throw new Error('useAlertsSheet must be used within AlertsSheetProvider')
  }
  return ctx
}
