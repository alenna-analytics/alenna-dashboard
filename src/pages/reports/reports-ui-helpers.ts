import { eachMonthOfInterval, endOfMonth, startOfMonth, subMonths } from 'date-fns'

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

/**
 * Previous period for dashboards / monthly charts: the same number of **calendar months**
 * immediately before the selected range (aligned with `mergeMonthlyRows`).
 *
 * Example: Apr–Jun → Jan–Mar so Apr vs Jan, May vs Feb, Jun vs Mar.
 */
export function computePreviousPeriod(
  startYmd: string,
  endYmd: string,
): { start: string; end: string } | null {
  const rawStart = parseLocalYmd(startYmd)
  const rawEnd = parseLocalYmd(endYmd)
  if (Number.isNaN(rawStart.getTime()) || Number.isNaN(rawEnd.getTime()) || rawStart > rawEnd) return null

  const rangeStart = startOfMonth(rawStart)
  const rangeEnd = endOfMonth(rawEnd)
  const monthsInRange = eachMonthOfInterval({ start: rangeStart, end: rangeEnd })
  const monthCount = monthsInRange.length
  if (monthCount < 1) return null

  const prevStart = startOfMonth(subMonths(rangeStart, monthCount))
  const prevEnd = endOfMonth(subMonths(rangeStart, 1))

  if (prevStart > prevEnd) return null
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
