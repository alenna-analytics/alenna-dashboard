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
    // open-ended monthly/once that started before range still overlaps if monthly
    // or if once? once only if start in range — handled below for once
    if (expense.recurrence_type === 'once') return false
  }
  if (expense.recurrence_type === 'once') {
    if (rangeStart !== null && expStart < rangeStart) return false
    if (rangeEnd !== null && expStart > rangeEnd) return false
  }
  return true
}

export function filterExpenses(rows: Expense[], filters: ExpensesFilters): Expense[] {
  const amount = filters.amountValue.trim() === '' ? null : Number(filters.amountValue)
  const hasAmount = amount !== null && Number.isFinite(amount)

  return rows.filter((row) => {
    if (!expenseOverlapsRange(row, filters.startDate, filters.endDate)) return false
    if (filters.recurrence && row.recurrence_type !== filters.recurrence) return false
    if (filters.currency && row.currency.toUpperCase() !== filters.currency) return false
    if (filters.category && row.category !== filters.category) return false
    if (hasAmount && amount !== null) {
      if (filters.amountOp === 'gte' && !(row.amount >= amount)) return false
      if (filters.amountOp === 'lte' && !(row.amount <= amount)) return false
      if (filters.amountOp === 'eq' && !(Math.abs(row.amount - amount) < 0.005)) return false
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

export function summarizeExpenses(
  rows: Expense[],
  opts: {
    displayCurrency: string
    baseCurrency: string
    latestFx: LatestFxForDisplay | null
  },
): ExpensesSummary {
  let mxnTotal = 0
  let usdTotal = 0
  for (const row of rows) {
    const code = row.currency.trim().toUpperCase()
    if (code === 'MXN') mxnTotal += row.amount
    if (code === 'USD') usdTotal += row.amount
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
    // Non MXN/USD display: convert each bucket via base when possible.
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
