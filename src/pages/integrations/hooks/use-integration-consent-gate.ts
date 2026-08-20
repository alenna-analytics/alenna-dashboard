import { useRef, useState } from 'react'

type ConsentGate = {
  open: boolean
  setOpen: (open: boolean) => void
  requestThen: (action: () => void) => void
  confirm: () => void
}

export function useIntegrationConsentGate(): ConsentGate {
  const [open, setOpenState] = useState(false)
  const actionRef = useRef<(() => void) | null>(null)

  const requestThen = (action: () => void) => {
    actionRef.current = action
    setOpenState(true)
  }

  const confirm = () => {
    const action = actionRef.current
    actionRef.current = null
    setOpenState(false)
    action?.()
  }

  const setOpen = (next: boolean) => {
    setOpenState(next)
    if (!next) actionRef.current = null
  }

  return { open, setOpen, requestThen, confirm }
}

export function needsInitialSyncConsent(lastSyncStatus: string | null | undefined): boolean {
  return lastSyncStatus == null || lastSyncStatus === 'not_synced'
}
