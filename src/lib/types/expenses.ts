export type ExpenseCategory =
  | 'payroll'
  | 'rent'
  | 'marketing'
  | 'logistics'
  | 'services'
  | 'suppliers'
  | 'ads'
  | 'other'

export type ExpenseRecurrence = 'once' | 'monthly'

export type Expense = {
  id: string
  label: string
  amount: number
  currency: string
  category: ExpenseCategory
  platform: string | null
  recurrence_type: ExpenseRecurrence
  day_of_month: number | null
  start_date: string
  end_date: string | null
}

export type ExpenseCreate = {
  label: string
  amount: number
  currency: string
  category: ExpenseCategory
  platform: string | null
  recurrence_type: ExpenseRecurrence
  day_of_month: number | null
  start_date: string
  end_date: string | null
}

export type ExpenseUpdate = Partial<ExpenseCreate>
