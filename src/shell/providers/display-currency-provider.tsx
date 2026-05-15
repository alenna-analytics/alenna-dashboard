import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@clerk/react'

import { apiFetch } from '@/lib/api'
import type { LatestFxForDisplay, MeResponse } from '@/lib/types/me-types'

export type DisplayCurrencyCode = 'MXN' | 'USD'

type DisplayCurrencyContextValue = {
  baseCurrency: string
  displayCurrency: string
  effectiveDisplayCurrency: string
  latestFx: LatestFxForDisplay | null
  setDisplayCurrency: (code: DisplayCurrencyCode | null) => Promise<void>
  isUpdating: boolean
}

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue | null>(null)

const STORAGE_KEY = 'alenna-display-currency'

function readStoredOverride(): DisplayCurrencyCode | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw === 'MXN' || raw === 'USD' ? raw : null
}

function writeStoredOverride(code: DisplayCurrencyCode | null): void {
  if (typeof window === 'undefined') return
  if (code === null) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, code)
}

export function DisplayCurrencyProvider({
  me,
  refetchMe,
  children,
}: {
  me: MeResponse | null
  refetchMe: () => Promise<void>
  children: ReactNode
}) {
  const { getToken } = useAuth()
  const baseCurrency = (me?.base_currency ?? 'MXN').toUpperCase()
  const serverDisplay = me?.display_currency ?? null
  const [override, setOverride] = useState<DisplayCurrencyCode | null>(() => readStoredOverride())
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (serverDisplay === 'MXN' || serverDisplay === 'USD') {
      setOverride(serverDisplay)
      writeStoredOverride(serverDisplay)
    } else if (serverDisplay === null && me !== null) {
      setOverride(null)
      writeStoredOverride(null)
    }
  }, [serverDisplay, me])

  const effectiveDisplayCurrency = (override ?? baseCurrency).toUpperCase()
  const displayCurrency = override ?? baseCurrency

  const setDisplayCurrency = useCallback(
    async (code: DisplayCurrencyCode | null) => {
      const normalized = code === null ? null : (code.toUpperCase() as DisplayCurrencyCode)
      // Optimistic update so the UI repaints immediately.
      setOverride(normalized)
      writeStoredOverride(normalized)
      setIsUpdating(true)
      try {
        const res = await apiFetch(
          '/me/preferences',
          (a) => getToken(a),
          {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ display_currency: normalized }),
          },
          me?.tenant_id ?? null,
        )
        if (!res.ok) {
          throw new Error(await res.text())
        }
        await refetchMe()
      } finally {
        setIsUpdating(false)
      }
    },
    [getToken, me?.tenant_id, refetchMe],
  )

  const value = useMemo<DisplayCurrencyContextValue>(
    () => ({
      baseCurrency,
      displayCurrency: displayCurrency.toUpperCase(),
      effectiveDisplayCurrency,
      latestFx: me?.latest_fx_for_display ?? null,
      setDisplayCurrency,
      isUpdating,
    }),
    [
      baseCurrency,
      displayCurrency,
      effectiveDisplayCurrency,
      me?.latest_fx_for_display,
      setDisplayCurrency,
      isUpdating,
    ],
  )

  return (
    <DisplayCurrencyContext.Provider value={value}>{children}</DisplayCurrencyContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is paired with provider
export function useDisplayCurrency() {
  const ctx = useContext(DisplayCurrencyContext)
  if (!ctx) {
    throw new Error('useDisplayCurrency must be used within DisplayCurrencyProvider')
  }
  return ctx
}
