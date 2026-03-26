export type AccountCurrency = 'MXN' | 'USD'

export type DisplayCurrency = AccountCurrency

export function parseAccountCurrency(raw: string | undefined | null): AccountCurrency {
  const u = (raw ?? 'MXN').trim().toUpperCase()
  return u === 'USD' ? 'USD' : 'MXN'
}

export function safeFxMxnPerUsd(raw: string | number | undefined | null): number {
  const n = typeof raw === 'string' ? Number(raw) : Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 18.5
}

/** Amounts from the API are in `base`; convert to `display` using MXN per 1 USD. */
export function convertAmountForDisplay(
  amountInBase: number,
  base: AccountCurrency,
  display: DisplayCurrency,
  fxMxnPerUsd: number,
): number {
  const fx = fxMxnPerUsd > 0 ? fxMxnPerUsd : 18.5
  if (base === display) return amountInBase
  if (base === 'MXN' && display === 'USD') return amountInBase / fx
  if (base === 'USD' && display === 'MXN') return amountInBase * fx
  return amountInBase
}

export function formatMoneyAmount(
  amount: number,
  currency: DisplayCurrency,
  lang: 'es' | 'en',
  compact: boolean,
): string {
  const locale = lang === 'es' ? 'es-MX' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: compact ? 1 : 0,
  }).format(amount)
}
