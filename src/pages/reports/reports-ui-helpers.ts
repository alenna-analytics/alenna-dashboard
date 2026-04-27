export function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseLocalYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function computePreviousPeriod(
  startYmd: string,
  endYmd: string,
): { start: string; end: string } | null {
  const start = parseLocalYmd(startYmd)
  const end = parseLocalYmd(endYmd)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return null
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  if (days < 1) return null
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - (days - 1))
  return { start: toYmd(prevStart), end: toYmd(prevEnd) }
}

export type PctTrend = 'up' | 'down' | 'flat'

export function pctVersusPrevious(
  current: number,
  previous: number,
): { pct: number; trend: PctTrend } | null {
  if (previous === 0 && current === 0) return { pct: 0, trend: 'flat' }
  if (previous === 0) return null
  const pct = ((current - previous) / Math.abs(previous)) * 100
  if (Math.abs(pct) < 0.005) return { pct: 0, trend: 'flat' }
  return { pct, trend: pct > 0 ? 'up' : 'down' }
}

export function fmtCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
