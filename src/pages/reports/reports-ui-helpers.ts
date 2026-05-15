import type { Locale } from 'date-fns'
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns'

import type { RevenueSeriesGranularity } from '@/lib/types/reports'

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

/** Same calendar span (inclusive days), shifted to end the day before `start`. */
export function computeShiftedPreviousPeriod(
  startYmd: string,
  endYmd: string,
): { start: string; end: string } | null {
  const rawStart = parseLocalYmd(startYmd)
  const rawEnd = parseLocalYmd(endYmd)
  if (Number.isNaN(rawStart.getTime()) || Number.isNaN(rawEnd.getTime()) || rawStart > rawEnd) return null

  const days = differenceInCalendarDays(rawEnd, rawStart) + 1
  if (days < 1) return null

  const prevEnd = subDays(rawStart, 1)
  const prevStart = subDays(prevEnd, days - 1)
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

/** Labels + stable bucket keys aligned with `mergeRevenueSeriesRows` / API `bucket_start`. */
export function eachRevenueBucketMeta(
  startYmd: string,
  endYmd: string,
  granularity: RevenueSeriesGranularity,
  locale: Locale,
): { bucketKey: string; label: string }[] {
  const d0 = parseLocalYmd(startYmd)
  const d1 = parseLocalYmd(endYmd)
  const lo = d0 <= d1 ? d0 : d1
  const hi = d0 <= d1 ? d1 : d0

  if (granularity === 'month') {
    const intervalStart = startOfMonth(lo)
    const intervalEnd = endOfMonth(hi)
    const months = eachMonthOfInterval({ start: intervalStart, end: intervalEnd })
    return months.map((d) => ({
      bucketKey: format(startOfMonth(d), 'yyyy-MM-dd'),
      label: format(d, 'MMM yyyy', { locale }),
    }))
  }

  if (granularity === 'day') {
    const days = eachDayOfInterval({ start: lo, end: hi })
    return days.map((d) => ({
      bucketKey: format(d, 'yyyy-MM-dd'),
      label: format(d, 'd MMM yyyy', { locale }),
    }))
  }

  const intervalStart = startOfWeek(lo, { weekStartsOn: 1 })
  const intervalEnd = endOfWeek(hi, { weekStartsOn: 1 })
  const weeks = eachWeekOfInterval({ start: intervalStart, end: intervalEnd }, { weekStartsOn: 1 })
  return weeks.map((d) => {
    const monday = startOfWeek(d, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(d, { weekStartsOn: 1 })
    return {
      bucketKey: format(monday, 'yyyy-MM-dd'),
      label:
        format(monday, 'd MMM', { locale }) + ' – ' + format(weekEnd, 'd MMM yyyy', { locale }),
    }
  })
}
