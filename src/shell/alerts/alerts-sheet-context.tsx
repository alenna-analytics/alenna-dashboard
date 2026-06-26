import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type AlertsSheetContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  openSheet: () => void
}

const AlertsSheetContext = createContext<AlertsSheetContextValue | null>(null)

export function AlertsSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const openSheet = useCallback(() => {
    setOpen(true)
  }, [])

  const value = useMemo(
    () => ({
      open,
      setOpen,
      openSheet,
    }),
    [open, openSheet],
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
