import type { LatestFxForDisplay } from '@/lib/types/me-types'

export type MoneyAmount = number | string | null | undefined

export type FormatMoneyOptions = {
  /**
   * Native currency of the amount being passed in. For aggregates this is
   * always `tenant.base_currency`. For native (per-channel) numbers this is
   * the channel's own currency code.
   */
  nativeCurrency: string
  /**
   * Currency the user has chosen to view amounts in. When `null` or equal to
   * `nativeCurrency` no conversion happens.
   */
  displayCurrency: string | null
  /**
   * Latest base->display rate from `/me`. Required when conversion is needed
   * and missing → kernel falls back to native rendering with no conversion.
   */
  latestFx: LatestFxForDisplay | null
  /**
   * Tenant base currency (`tenant.base_currency`). Used to resolve whether
   * an amount in native currency can be converted to display via `latestFx`.
   * Conversion only happens when `nativeCurrency === baseCurrency`.
   */
  baseCurrency: string
  /**
   * Forward-compatible Option B hook: the calendar date of the economic
   * event being shown (order date, aggregate bucket date, etc.). v1 ignores
   * this and always uses `latestFx`. Future implementations will pass each
   * point through a point-in-time lookup without changing the signature.
   */
  asOfDate?: string | null
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  /** Locale override; defaults to the runtime locale. */
  locale?: string
}

const _normalize = (code: string): string => code.trim().toUpperCase()

const _toNumber = (amount: MoneyAmount): number => {
  if (amount === null || amount === undefined) return 0
  if (typeof amount === 'number') return amount
  const parsed = Number(amount)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Resolve `(amount, native -> display)` to a display-currency number.
 *
 * Conversion applies only when `nativeCurrency === baseCurrency` and a
 * latest rate is available; otherwise the native amount is returned
 * unchanged so per-channel native renderings stay accurate.
 */
export function convertAmount(amount: MoneyAmount, opts: FormatMoneyOptions): {
  amount: number
  currency: string
  converted: boolean
} {
  const native = _normalize(opts.nativeCurrency)
  const base = _normalize(opts.baseCurrency)
  const display = opts.displayCurrency ? _normalize(opts.displayCurrency) : null
  const num = _toNumber(amount)

  if (display === null || display === native) {
    return { amount: num, currency: native, converted: false }
  }
  if (native !== base) {
    // Native currency differs from the base currency we have an FX rate for.
    // Render native as-is; UI displays a `native` badge alongside.
    return { amount: num, currency: native, converted: false }
  }
  if (opts.latestFx === null) {
    return { amount: num, currency: native, converted: false }
  }
  const fxFrom = _normalize(opts.latestFx.from)
  const fxTo = _normalize(opts.latestFx.to)
  if (fxFrom !== base || fxTo !== display) {
    return { amount: num, currency: native, converted: false }
  }
  const rate = Number(opts.latestFx.rate)
  if (!Number.isFinite(rate) || rate <= 0) {
    return { amount: num, currency: native, converted: false }
  }
  return {
    amount: num * rate,
    currency: display,
    converted: true,
  }
}

/**
 * Format `amount` for display using `Intl.NumberFormat`. See
 * {@link convertAmount} for the conversion contract.
 */
export function formatMoney(amount: MoneyAmount, opts: FormatMoneyOptions): string {
  const { amount: value, currency } = convertAmount(amount, opts)
  return new Intl.NumberFormat(opts.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: opts.minimumFractionDigits ?? 2,
    maximumFractionDigits: opts.maximumFractionDigits ?? 2,
  }).format(value)
}
