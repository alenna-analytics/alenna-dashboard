import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type UseBulkCogsLeaveGuardOptions = {
  hasUnsavedChanges: boolean
  enabled: boolean
}

type UseBulkCogsLeaveGuardResult = {
  leaveDialogOpen: boolean
  setLeaveDialogOpen: (open: boolean) => void
  confirmLeave: () => void
}

export function useBulkCogsLeaveGuard({
  hasUnsavedChanges,
  enabled,
}: UseBulkCogsLeaveGuardOptions): UseBulkCogsLeaveGuardResult {
  const navigate = useNavigate()
  const location = useLocation()
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const pendingHrefRef = useRef<string | null>(null)
  const pendingBackRef = useRef(false)

  const confirmLeave = useCallback(() => {
    setLeaveDialogOpen(false)
    const back = pendingBackRef.current
    const href = pendingHrefRef.current
    pendingBackRef.current = false
    pendingHrefRef.current = null
    if (back) {
      navigate(-1)
      return
    }
    if (href) {
      navigate(href)
    }
  }, [navigate])

  const setLeaveDialogOpenSafe = useCallback((open: boolean) => {
    if (!open) {
      pendingBackRef.current = false
      pendingHrefRef.current = null
    }
    setLeaveDialogOpen(open)
  }, [])

  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [enabled, hasUnsavedChanges])

  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return
    window.history.pushState(null, '', location.pathname + location.search)
    const onPopState = () => {
      pendingBackRef.current = true
      pendingHrefRef.current = null
      setLeaveDialogOpen(true)
      window.history.pushState(null, '', location.pathname + location.search)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [enabled, hasUnsavedChanges, location.pathname, location.search])

  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return
    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) {
        return
      }
      const path = href.split('?')[0]?.split('#')[0] ?? href
      if (path === location.pathname) return
      event.preventDefault()
      event.stopPropagation()
      pendingBackRef.current = false
      pendingHrefRef.current = href
      setLeaveDialogOpen(true)
    }
    document.addEventListener('click', onClickCapture, true)
    return () => document.removeEventListener('click', onClickCapture, true)
  }, [enabled, hasUnsavedChanges, location.pathname])

  return {
    leaveDialogOpen,
    setLeaveDialogOpen: setLeaveDialogOpenSafe,
    confirmLeave,
  }
}
