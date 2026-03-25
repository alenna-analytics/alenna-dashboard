import { useCallback, useState } from 'react'

const STORAGE_KEY = 'ecom-sidebar-collapsed'

function readInitial(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(STORAGE_KEY) === '1'
}

export function useSidebarCollapsed(): {
  collapsed: boolean
  toggleCollapsed: () => void
} {
  const [collapsed, setCollapsed] = useState(readInitial)

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }, [])

  return { collapsed, toggleCollapsed }
}
