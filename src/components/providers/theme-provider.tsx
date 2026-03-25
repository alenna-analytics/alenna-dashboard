import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type ThemeMode = 'dark' | 'light'

type ThemeContextValue = {
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'ecom-analytics-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    return stored === 'light' || stored === 'dark' ? stored : 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
