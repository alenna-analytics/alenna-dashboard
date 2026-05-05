import { useCallback, useMemo } from 'react'

import {
  convertAmount,
  formatMoney,
  type FormatMoneyOptions,
  type MoneyAmount,
} from '@/lib/format/money'
import { useDisplayCurrency } from '@/shell/providers/display-currency-provider'

type FormatOptions = Omit<
  FormatMoneyOptions,
  'displayCurrency' | 'latestFx' | 'baseCurrency'
> & {
  /** ISO 4217 native currency of `amount`; defaults to tenant base. */
  nativeCurrency?: string
}

/**
 * `useMoney` returns formatting and conversion helpers bound to the user's
 * current display-currency preference. Always pass the **native** currency
 * of the amount being shown — for aggregates that's the tenant's base
 * currency; for per-channel surfaces that's whatever the connector sent.
 */
export function useMoney(): {
  format: (amount: MoneyAmount, options?: FormatOptions) => string
  convert: (
    amount: MoneyAmount,
    options?: FormatOptions,
  ) => { amount: number; currency: string; converted: boolean }
  baseCurrency: string
  displayCurrency: string
  effectiveDisplayCurrency: string
  latestFxRateDate: string | null
  fxFromCurrency: string | null
  fxToCurrency: string | null
} {
  const ctx = useDisplayCurrency()

  const buildOpts = useCallback(
    (options?: FormatOptions): FormatMoneyOptions => ({
      nativeCurrency: options?.nativeCurrency ?? ctx.baseCurrency,
      displayCurrency: ctx.effectiveDisplayCurrency,
      latestFx: ctx.latestFx,
      baseCurrency: ctx.baseCurrency,
      asOfDate: options?.asOfDate,
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits,
      locale: options?.locale,
    }),
    [ctx.baseCurrency, ctx.effectiveDisplayCurrency, ctx.latestFx],
  )

  const format = useCallback(
    (amount: MoneyAmount, options?: FormatOptions) => formatMoney(amount, buildOpts(options)),
    [buildOpts],
  )

  const convert = useCallback(
    (amount: MoneyAmount, options?: FormatOptions) => convertAmount(amount, buildOpts(options)),
    [buildOpts],
  )

  return useMemo(
    () => ({
      format,
      convert,
      baseCurrency: ctx.baseCurrency,
      displayCurrency: ctx.displayCurrency,
      effectiveDisplayCurrency: ctx.effectiveDisplayCurrency,
      latestFxRateDate: ctx.latestFx?.rate_date ?? null,
      fxFromCurrency: ctx.latestFx?.from ?? null,
      fxToCurrency: ctx.latestFx?.to ?? null,
    }),
    [
      format,
      convert,
      ctx.baseCurrency,
      ctx.displayCurrency,
      ctx.effectiveDisplayCurrency,
      ctx.latestFx,
    ],
  )
}
