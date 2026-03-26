import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { useLanguage } from '@/components/providers/language-provider'
import {
  convertAmountForDisplay,
  formatMoneyAmount,
  formatMoneyAmountWithoutCurrency,
  parseAccountCurrency,
  safeFxMxnPerUsd,
  type AccountCurrency,
  type DisplayCurrency,
} from '@/lib/currency-core'

const STORAGE_KEY = 'ecom-analytics-display-currency'

type CurrencyContextValue = {
  baseCurrency: AccountCurrency
  fxMxnPerUsd: number
  displayCurrency: DisplayCurrency
  setDisplayCurrency: (c: DisplayCurrency) => void
  formatCurrency: (value: string | number) => string
  formatCurrencyCompact: (value: string | number) => string
  /** Same conversion as `formatCurrency` but digits only (no MX$/USD in the string). */
  formatCurrencyValue: (value: string | number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

function readStoredDisplay(): DisplayCurrency {
  if (typeof window === 'undefined') return 'MXN'
  const s = window.localStorage.getItem(STORAGE_KEY)
  return s === 'USD' || s === 'MXN' ? s : 'MXN'
}

export function CurrencyProvider({
  baseCurrencyRaw,
  fxMxnPerUsdRaw,
  children,
}: {
  baseCurrencyRaw: string | undefined | null
  fxMxnPerUsdRaw: string | number | undefined | null
  children: ReactNode
}) {
  const { lang } = useLanguage()
  const baseCurrency = parseAccountCurrency(baseCurrencyRaw)
  const fxMxnPerUsd = safeFxMxnPerUsd(fxMxnPerUsdRaw)

  const [displayCurrency, setDisplayState] = useState<DisplayCurrency>(readStoredDisplay)

  const setDisplayCurrency = useCallback((c: DisplayCurrency) => {
    setDisplayState(c)
    window.localStorage.setItem(STORAGE_KEY, c)
  }, [])

  const formatCurrency = useCallback(
    (value: string | number) => {
      const n = convertAmountForDisplay(
        Number(value),
        baseCurrency,
        displayCurrency,
        fxMxnPerUsd,
      )
      return formatMoneyAmount(n, displayCurrency, lang, false)
    },
    [baseCurrency, displayCurrency, fxMxnPerUsd, lang],
  )

  const formatCurrencyCompact = useCallback(
    (value: string | number) => {
      const n = convertAmountForDisplay(
        Number(value),
        baseCurrency,
        displayCurrency,
        fxMxnPerUsd,
      )
      return formatMoneyAmount(n, displayCurrency, lang, true)
    },
    [baseCurrency, displayCurrency, fxMxnPerUsd, lang],
  )

  const formatCurrencyValue = useCallback(
    (value: string | number) => {
      const n = convertAmountForDisplay(
        Number(value),
        baseCurrency,
        displayCurrency,
        fxMxnPerUsd,
      )
      return formatMoneyAmountWithoutCurrency(n, lang, false)
    },
    [baseCurrency, displayCurrency, fxMxnPerUsd, lang],
  )

  const value = useMemo(
    () => ({
      baseCurrency,
      fxMxnPerUsd,
      displayCurrency,
      setDisplayCurrency,
      formatCurrency,
      formatCurrencyCompact,
      formatCurrencyValue,
    }),
    [
      baseCurrency,
      displayCurrency,
      fxMxnPerUsd,
      formatCurrency,
      formatCurrencyCompact,
      formatCurrencyValue,
      setDisplayCurrency,
    ],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is paired with provider
export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return ctx
}
