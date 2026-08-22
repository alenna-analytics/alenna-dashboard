import { describe, expect, it } from 'vitest'

import type { Expense } from '@/lib/types/expenses'
import type { LatestFxForDisplay } from '@/lib/types/me-types'
import {
  filterExpenses,
  prorateExpenseAmount,
  summarizeExpenses,
  type ExpensesFilters,
} from '@/pages/expenses/expenses-helpers'

function expense(partial: Partial<Expense> & Pick<Expense, 'amount' | 'currency'>): Expense {
  return {
    id: partial.id ?? 'e1',
    label: partial.label ?? 'Test',
    amount: partial.amount,
    currency: partial.currency,
    category: partial.category ?? 'rent',
    platform: partial.platform ?? null,
    recurrence_type: partial.recurrence_type ?? 'once',
    day_of_month: partial.day_of_month ?? null,
    start_date: partial.start_date ?? '2026-04-15',
    end_date: partial.end_date ?? null,
  }
}

const fxUsdToMxn: LatestFxForDisplay = {
  rate: '20',
  rate_date: '2026-04-01',
  from: 'USD',
  to: 'MXN',
}

const baseFilters = (): ExpensesFilters => ({
  startDate: '',
  endDate: '',
  recurrence: '',
  currency: '',
  category: '',
  amountOp: 'gte',
  amountValue: '',
})

describe('summarizeExpenses', () => {
  it('combines MXN + USD via FX into display currency', () => {
    const summary = summarizeExpenses(
      [expense({ amount: 100, currency: 'MXN' }), expense({ amount: 10, currency: 'USD' })],
      { displayCurrency: 'MXN', baseCurrency: 'MXN', latestFx: fxUsdToMxn },
    )
    expect(summary.mxnTotal).toBe(100)
    expect(summary.usdTotal).toBe(10)
    expect(summary.combinedDisplay).toBe(300)
  })

  it('returns null combined when FX missing and both currencies present', () => {
    const summary = summarizeExpenses(
      [expense({ amount: 100, currency: 'MXN' }), expense({ amount: 10, currency: 'USD' })],
      { displayCurrency: 'MXN', baseCurrency: 'MXN', latestFx: null },
    )
    expect(summary.combinedDisplay).toBeNull()
  })

  it('recognizes full monthly amount on day 1 even in a half-month window', () => {
    const monthly = expense({
      amount: 3000,
      currency: 'MXN',
      recurrence_type: 'monthly',
      start_date: '2026-04-01',
      end_date: null,
    })
    const summary = summarizeExpenses([monthly], {
      displayCurrency: 'MXN',
      baseCurrency: 'MXN',
      latestFx: null,
      startDate: '2026-04-01',
      endDate: '2026-04-15',
    })
    expect(summary.mxnTotal).toBe(3000)
  })

  it('one_time outside window contributes 0 when dates set', () => {
    const once = expense({
      amount: 500,
      currency: 'MXN',
      recurrence_type: 'once',
      start_date: '2026-03-01',
    })
    const summary = summarizeExpenses([once], {
      displayCurrency: 'MXN',
      baseCurrency: 'MXN',
      latestFx: null,
      startDate: '2026-04-01',
      endDate: '2026-04-30',
    })
    expect(summary.mxnTotal).toBe(0)
  })
})

describe('prorateExpenseAmount', () => {
  it('returns full once amount when start in window', () => {
    const once = expense({
      amount: 80,
      currency: 'USD',
      recurrence_type: 'once',
      start_date: '2026-04-10',
    })
    expect(prorateExpenseAmount(80, once, '2026-04-01', '2026-04-30')).toBe(80)
  })

  it('skips monthly amount when charge day is after the window', () => {
    const monthly = expense({
      amount: 25000,
      currency: 'MXN',
      recurrence_type: 'monthly',
      start_date: '2026-01-01',
      day_of_month: 25,
    })
    expect(prorateExpenseAmount(25000, monthly, '2026-08-01', '2026-08-22')).toBe(0)
  })

  it('recognizes monthly amount when charge day falls in the window', () => {
    const monthly = expense({
      amount: 25000,
      currency: 'MXN',
      recurrence_type: 'monthly',
      start_date: '2026-01-01',
      day_of_month: 15,
    })
    expect(prorateExpenseAmount(25000, monthly, '2026-08-01', '2026-08-22')).toBe(25000)
  })
})

describe('filterExpenses amount FX', () => {
  it('compares USD row in MXN via FX', () => {
    const rows = [
      expense({ id: 'usd', amount: 10, currency: 'USD' }),
      expense({ id: 'mxn', amount: 50, currency: 'MXN' }),
    ]
    const filtered = filterExpenses(
      rows,
      { ...baseFilters(), amountOp: 'gte', amountValue: '150', currency: 'MXN' },
      fxUsdToMxn,
      'MXN',
    )
    // currency filter MXN excludes USD row before amount compare
    expect(filtered.map((r) => r.id)).toEqual([])
  })

  it('converts without currency filter using compare=base', () => {
    const rows = [
      expense({ id: 'usd', amount: 10, currency: 'USD' }),
      expense({ id: 'mxn', amount: 50, currency: 'MXN' }),
    ]
    const filtered = filterExpenses(
      rows,
      { ...baseFilters(), amountOp: 'gte', amountValue: '150' },
      fxUsdToMxn,
      'MXN',
    )
    expect(filtered.map((r) => r.id)).toEqual(['usd'])
  })

  it('excludes mixed-currency row when amount filter active and FX missing', () => {
    const rows = [
      expense({ id: 'usd', amount: 10, currency: 'USD' }),
      expense({ id: 'mxn', amount: 200, currency: 'MXN' }),
    ]
    const filtered = filterExpenses(
      rows,
      { ...baseFilters(), amountOp: 'gte', amountValue: '100' },
      null,
      'MXN',
    )
    expect(filtered.map((r) => r.id)).toEqual(['mxn'])
  })
})
