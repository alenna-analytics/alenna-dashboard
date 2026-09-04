import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type MatchSuggestionsSheetContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  openSheet: () => void
}

const MatchSuggestionsSheetContext = createContext<MatchSuggestionsSheetContextValue | null>(null)

export function MatchSuggestionsSheetProvider({ children }: { children: ReactNode }) {
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

  return (
    <MatchSuggestionsSheetContext.Provider value={value}>
      {children}
    </MatchSuggestionsSheetContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is paired with provider
export function useMatchSuggestionsSheet(): MatchSuggestionsSheetContextValue {
  const ctx = useContext(MatchSuggestionsSheetContext)
  if (!ctx) {
    throw new Error('useMatchSuggestionsSheet must be used within MatchSuggestionsSheetProvider')
  }
  return ctx
}
