import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { Expense, ExpenseCategory, ExpenseRecurrence } from '@/lib/types/expenses'
import type { LatestFxForDisplay } from '@/lib/types/me-types'

export const EXPENSE_CURRENCIES = ['MXN', 'USD'] as const
export type ExpenseCurrencyCode = (typeof EXPENSE_CURRENCIES)[number]

export type AmountCompareOp = 'gte' | 'lte' | 'eq'

export type ExpensesFilters = {
  startDate: string
  endDate: string
  recurrence: '' | ExpenseRecurrence
  currency: '' | ExpenseCurrencyCode
  category: '' | ExpenseCategory
  amountOp: AmountCompareOp
  amountValue: string
}

export function categoryLabelKey(category: ExpenseCategory): ShellStringKey {
  switch (category) {
    case 'payroll':
      return 'expensesCatPayroll'
    case 'rent':
      return 'expensesCatRent'
    case 'marketing':
      return 'expensesCatMarketing'
    case 'logistics':
      return 'expensesCatLogistics'
    case 'services':
      return 'expensesCatServices'
    case 'suppliers':
      return 'expensesCatSuppliers'
    case 'ads':
      return 'expensesCatAds'
    default:
      return 'expensesCatOther'
  }
}

export function recurrenceLabelKey(recurrence: ExpenseRecurrence): ShellStringKey {
  return recurrence === 'monthly' ? 'expensesRecurrenceMonthly' : 'expensesRecurrenceOnce'
}

function parseYmd(value: string): number | null {
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null
  const t = Date.parse(`${trimmed}T00:00:00`)
  return Number.isFinite(t) ? t : null
}

function ymdParts(value: string): { y: number; m: number; d: number } | null {
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null
  const [ys, ms, ds] = trimmed.split('-')
  const y = Number(ys)
  const m = Number(ms)
  const d = Number(ds)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
  return { y, m, d }
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate()
}

function expenseOverlapsRange(expense: Expense, startDate: string, endDate: string): boolean {
  if (!startDate && !endDate) return true
  const expStart = parseYmd(expense.start_date)
  if (expStart === null) return false
  const expEnd = expense.end_date ? parseYmd(expense.end_date) : null
  const rangeStart = startDate ? parseYmd(startDate) : null
  const rangeEnd = endDate ? parseYmd(endDate) : null
  if (rangeEnd !== null && expStart > rangeEnd) return false
  if (rangeStart !== null && expEnd !== null && expEnd < rangeStart) return false
  if (rangeStart !== null && expEnd === null && expStart < rangeStart) {
    if (expense.recurrence_type === 'once') return false
  }
  if (expense.recurrence_type === 'once') {
    if (rangeStart !== null && expStart < rangeStart) return false
    if (rangeEnd !== null && expStart > rangeEnd) return false
  }
  return true
}

type FxPair = {
  from: string
  to: string
  rate: number
}

function readFxPair(latestFx: LatestFxForDisplay | null): FxPair | null {
  if (!latestFx) return null
  const raw = latestFx as LatestFxForDisplay & {
    from_currency?: string
    to_currency?: string
  }
  const from = (raw.from ?? raw.from_currency ?? '').trim().toUpperCase()
  const to = (raw.to ?? raw.to_currency ?? '').trim().toUpperCase()
  const rate = Number(latestFx.rate)
  if (!from || !to || !Number.isFinite(rate) || rate <= 0) return null
  return { from, to, rate }
}

/** Convert between MXN and USD using a latest FX pair (either direction). */
function convertMxnUsd(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  pair: FxPair | null,
): number | null {
  const from = fromCurrency.trim().toUpperCase()
  const to = toCurrency.trim().toUpperCase()
  if (from === to) return amount
  if (!pair) return null
  if (from === pair.from && to === pair.to) return amount * pair.rate
  if (from === pair.to && to === pair.from) return amount / pair.rate
  return null
}

/**
 * Monthly: full amount on charge day (default 1) if that date is in the window.
 * Once: full amount if start_date in window, else 0.
 */
export function prorateExpenseAmount(
  amount: number,
  expense: Expense,
  queryStart: string,
  queryEnd: string,
): number {
  const qs = ymdParts(queryStart)
  const qe = ymdParts(queryEnd)
  const es = ymdParts(expense.start_date)
  if (!qs || !qe || !es) return 0

  if (expense.recurrence_type === 'once') {
    const startMs = parseYmd(expense.start_date)
    const qStartMs = parseYmd(queryStart)
    const qEndMs = parseYmd(queryEnd)
    if (startMs === null || qStartMs === null || qEndMs === null) return 0
    if (startMs < qStartMs || startMs > qEndMs) return 0
    return amount
  }

  const expEndParts = expense.end_date ? ymdParts(expense.end_date) : null
  const rawDay = expense.day_of_month
  const chargeDom = rawDay == null || rawDay < 1 ? 1 : Math.min(rawDay, 28)
  const qStartMs = Date.UTC(qs.y, qs.m - 1, qs.d)
  const qEndMs = Date.UTC(qe.y, qe.m - 1, qe.d)
  const expStartMs = Date.UTC(es.y, es.m - 1, es.d)
  const expEndMs = expEndParts
    ? Date.UTC(expEndParts.y, expEndParts.m - 1, expEndParts.d)
    : null

  let total = 0
  let cy = qs.y
  let cm = qs.m

  while (cy < qe.y || (cy === qe.y && cm <= qe.m)) {
    const dim = daysInMonth(cy, cm)
    const monthStart = Date.UTC(cy, cm - 1, 1)
    const monthEnd = Date.UTC(cy, cm - 1, dim)
    const active =
      expStartMs <= monthEnd && (expEndMs === null || expEndMs >= monthStart)
    if (active) {
      let chargeMs = Date.UTC(cy, cm - 1, Math.min(chargeDom, dim))
      if (chargeMs < expStartMs) chargeMs = expStartMs
      if (expEndMs === null || chargeMs <= expEndMs) {
        if (chargeMs >= qStartMs && chargeMs <= qEndMs) total += amount
      }
    }
    if (cm === 12) {
      cy += 1
      cm = 1
    } else {
      cm += 1
    }
  }
  return total
}

export function filterExpenses(
  rows: Expense[],
  filters: ExpensesFilters,
  latestFx: LatestFxForDisplay | null,
  baseCurrency: string,
): Expense[] {
  const amount = filters.amountValue.trim() === '' ? null : Number(filters.amountValue)
  const hasAmount = amount !== null && Number.isFinite(amount)
  const compareCurrency = (filters.currency || baseCurrency).trim().toUpperCase()
  const pair = readFxPair(latestFx)

  return rows.filter((row) => {
    if (!expenseOverlapsRange(row, filters.startDate, filters.endDate)) return false
    if (filters.recurrence && row.recurrence_type !== filters.recurrence) return false
    if (filters.currency && row.currency.toUpperCase() !== filters.currency) return false
    if (filters.category && row.category !== filters.category) return false
    if (hasAmount && amount !== null) {
      const converted = convertMxnUsd(
        row.amount,
        row.currency,
        compareCurrency,
        pair,
      )
      if (converted === null) return false
      if (filters.amountOp === 'gte' && !(converted >= amount)) return false
      if (filters.amountOp === 'lte' && !(converted <= amount)) return false
      if (filters.amountOp === 'eq' && !(Math.abs(converted - amount) < 0.005)) return false
    }
    return true
  })
}

export type ExpensesSummary = {
  count: number
  mxnTotal: number
  usdTotal: number
  combinedDisplay: number | null
  displayCurrency: string
}

/**
 * Summarize expense amounts.
 * When both `startDate` and `endDate` are set, monthly amounts are recognized
 * on the charge day (same idea as API P&L). When either date is missing, uses
 * catalog face amounts (no silent half-window).
 */
export function summarizeExpenses(
  rows: Expense[],
  opts: {
    displayCurrency: string
    baseCurrency: string
    latestFx: LatestFxForDisplay | null
    startDate?: string
    endDate?: string
  },
): ExpensesSummary {
  const start = (opts.startDate ?? '').trim()
  const end = (opts.endDate ?? '').trim()
  const useProration = Boolean(start && end)

  let mxnTotal = 0
  let usdTotal = 0
  for (const row of rows) {
    const code = row.currency.trim().toUpperCase()
    const amt = useProration
      ? prorateExpenseAmount(row.amount, row, start, end)
      : row.amount
    if (code === 'MXN') mxnTotal += amt
    if (code === 'USD') usdTotal += amt
  }

  const display = opts.displayCurrency.trim().toUpperCase()
  const pair = readFxPair(opts.latestFx)

  let combinedDisplay: number | null = null
  if (display === 'MXN') {
    const usdAsMxn = convertMxnUsd(usdTotal, 'USD', 'MXN', pair)
    if (usdTotal === 0) combinedDisplay = mxnTotal
    else if (usdAsMxn !== null) combinedDisplay = mxnTotal + usdAsMxn
  } else if (display === 'USD') {
    const mxnAsUsd = convertMxnUsd(mxnTotal, 'MXN', 'USD', pair)
    if (mxnTotal === 0) combinedDisplay = usdTotal
    else if (mxnAsUsd !== null) combinedDisplay = usdTotal + mxnAsUsd
  } else {
    const base = opts.baseCurrency.trim().toUpperCase()
    const mxnAsDisplay = convertMxnUsd(mxnTotal, 'MXN', display, pair)
    const usdAsDisplay = convertMxnUsd(usdTotal, 'USD', display, pair)
    if (mxnAsDisplay !== null && usdAsDisplay !== null) {
      combinedDisplay = mxnAsDisplay + usdAsDisplay
    } else if (display === base) {
      const mxnAsBase = convertMxnUsd(mxnTotal, 'MXN', base, pair)
      const usdAsBase = convertMxnUsd(usdTotal, 'USD', base, pair)
      if ((mxnTotal === 0 || mxnAsBase !== null) && (usdTotal === 0 || usdAsBase !== null)) {
        combinedDisplay = (mxnAsBase ?? mxnTotal) + (usdAsBase ?? usdTotal)
      }
    }
  }

  return {
    count: rows.length,
    mxnTotal,
    usdTotal,
    combinedDisplay,
    displayCurrency: opts.displayCurrency,
  }
}
