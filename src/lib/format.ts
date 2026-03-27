const MXN = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const MXN_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'MXN',
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

const NUM = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const PCT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  style: 'percent',
})

export function fmtCurrency(value: string | number): string {
  return MXN.format(Number(value))
}

export function fmtCurrencyCompact(value: string | number): string {
  return MXN_COMPACT.format(Number(value))
}

export function fmtNumber(value: string | number): string {
  return NUM.format(Number(value))
}

export function fmtPct(value: string | number): string {
  return PCT.format(Number(value) / 100)
}

export function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function fmtDateByLanguage(iso: string, language: 'es' | 'en' | string): string {
  const locale = language === 'es' ? 'es-MX' : 'en-US'
  return new Date(iso + 'T00:00:00').toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })
}

export function toIso(d: Date): string {
  return d.toISOString().split('T')[0]
}

/** Calendar date in local timezone (YYYY-MM-DD). Prefer for range shortcuts. */
export function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
