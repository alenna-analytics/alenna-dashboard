import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type PageMeta = {
  title: string
}

type PageChromeContextValue = PageMeta & {
  setPageMeta: (meta: PageMeta) => void
}

const PageChromeContext = createContext<PageChromeContextValue | null>(null)

export function PageChromeProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<PageMeta>({ title: '' })

  const setPageMeta = useCallback((m: PageMeta) => {
    setMeta(m)
  }, [])

  const value = useMemo(
    () => ({
      ...meta,
      setPageMeta,
    }),
    [meta, setPageMeta],
  )

  return (
    <PageChromeContext.Provider value={value}>{children}</PageChromeContext.Provider>
  )
}

export function usePageChrome() {
  const ctx = useContext(PageChromeContext)
  if (!ctx) {
    throw new Error('usePageChrome must be used within PageChromeProvider')
  }
  return ctx
}
