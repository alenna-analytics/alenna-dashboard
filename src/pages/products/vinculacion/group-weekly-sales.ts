import type { MonthlyRevenueMonthRow } from '@/lib/types/reports'

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export type WeeklyNetSalesBar = {
  weekStart: string
  weekLabel: string
  netSales: number
  units: number
  incomplete: boolean
}

export function parseDay(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  return new Date(year || 0, (month || 1) - 1, day || 1)
}

export function formatDay(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function mondayOf(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = copy.getDay()
  const delta = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + delta)
  return copy
}

export function formatShortDayMonth(date: Date, lang: string): string {
  const months = lang === 'en' ? MONTHS_EN : MONTHS_ES
  return `${date.getDate()} ${months[date.getMonth()] ?? ''}`
}

export function formatInsightRange(start: string, end: string, lang: string): string {
  const from = parseDay(start)
  const to = parseDay(end)
  if (from.getFullYear() === to.getFullYear()) {
    return `${formatShortDayMonth(from, lang)} – ${formatShortDayMonth(to, lang)} ${to.getFullYear()}`
  }
  return `${formatShortDayMonth(from, lang)} ${from.getFullYear()} – ${formatShortDayMonth(to, lang)} ${to.getFullYear()}`
}

export function formatStockoutDate(date: Date, lang: string): string {
  return `${formatShortDayMonth(date, lang)} ${date.getFullYear()}`
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)
  return next
}

export function isWeekIncomplete(
  weekStart: Date,
  rangeStart: Date,
  rangeEnd: Date,
  today: Date,
): boolean {
  const weekEnd = addDays(weekStart, 6)
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return weekStart < rangeStart || weekEnd > rangeEnd || weekEnd > todayStart
}

export function buildWeeklyNetSalesBars(
  rows: MonthlyRevenueMonthRow[],
  start: string,
  end: string,
  lang: string,
  today: Date,
): WeeklyNetSalesBar[] {
  if (!start || !end) return []
  const rangeStart = parseDay(start)
  const rangeEnd = parseDay(end)
  if (rangeEnd < rangeStart) return []

  const byWeek = new Map<string, MonthlyRevenueMonthRow>()
  for (const row of rows) {
    const key = formatDay(mondayOf(parseDay(row.month_start)))
    const existing = byWeek.get(key)
    if (!existing) {
      byWeek.set(key, row)
      continue
    }
    byWeek.set(key, {
      ...existing,
      net_revenue: (existing.net_revenue ?? 0) + (row.net_revenue ?? 0),
      units_sold: (existing.units_sold ?? 0) + (row.units_sold ?? 0),
    })
  }

  const bars: WeeklyNetSalesBar[] = []
  for (
    let cursor = mondayOf(rangeStart);
    cursor <= rangeEnd;
    cursor = addDays(cursor, 7)
  ) {
    const weekStart = formatDay(cursor)
    const row = byWeek.get(weekStart)
    bars.push({
      weekStart,
      weekLabel: formatShortDayMonth(cursor, lang),
      netSales: row?.net_revenue ?? 0,
      units: row?.units_sold ?? 0,
      incomplete: isWeekIncomplete(cursor, rangeStart, rangeEnd, today),
    })
  }
  return bars
}
