import { useEffect, type ReactNode } from 'react'

const STORAGE_KEY = 'ecom-analytics-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])
  return <>{children}</>
}
