import { useState, type ReactNode } from 'react'

import { shellT } from '@/lib/i18n/shell-strings'
import type { Expense, ExpenseCategory, ExpenseCreate, ExpenseRecurrence } from '@/lib/types/expenses'
import {
  CHARGE_DAY_MAX,
  CHARGE_DAY_MIN,
  EXPENSE_CURRENCIES,
  sanitizeChargeDayInput,
  type ExpenseCurrencyCode,
} from '@/pages/expenses/expenses-helpers'
import { useLanguage } from '@/shell/providers/language-provider'
import { Button } from '@/ui/button'
import { DatePicker } from '@/ui/date-picker'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import type { FilterOption } from '@/ui/filters/types'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'

const GLOBAL_PLATFORM = 'global'

const FORM_GRID =
  'grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start sm:gap-x-8'

type Platform = { slug: string; name: string }

type ExpensesSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
  platforms: Platform[]
  defaultCurrency: ExpenseCurrencyCode
  onCreate: (body: ExpenseCreate) => Promise<void>
  onUpdate: (id: string, body: Partial<ExpenseCreate>) => Promise<void>
  isBusy?: boolean
}

type FormState = {
  label: string
  amount: string
  currency: ExpenseCurrencyCode
  category: ExpenseCategory
  platform: string
  recurrence_type: ExpenseRecurrence
  day_of_month: string
  start_date: string
  end_date: string
}

type ParsedChargeDay =
  | { status: 'empty' }
  | { status: 'ok'; day: number }
  | { status: 'invalid' }

type FormRowProps = {
  label: string
  htmlFor?: string
  children: ReactNode
}

function FormRow({ label, htmlFor, children }: FormRowProps) {
  return (
    <div className={FORM_GRID}>
      <Label htmlFor={htmlFor} className="items-start leading-snug sm:pt-2">
        {label}
      </Label>
      <div>{children}</div>
    </div>
  )
}

function emptyForm(defaultCurrency: ExpenseCurrencyCode): FormState {
  return {
    label: '',
    amount: '',
    currency: defaultCurrency,
    category: 'other',
    platform: GLOBAL_PLATFORM,
    recurrence_type: 'once',
    day_of_month: '',
    start_date: '',
    end_date: '',
  }
}

function normalizeCurrency(value: string, fallback: ExpenseCurrencyCode): ExpenseCurrencyCode {
  const code = value.trim().toUpperCase()
  return code === 'USD' || code === 'MXN' ? code : fallback
}

function expenseToForm(e: Expense, fallback: ExpenseCurrencyCode): FormState {
  return {
    label: e.label,
    amount: String(e.amount),
    currency: normalizeCurrency(e.currency, fallback),
    category: e.category,
    platform: e.platform ?? GLOBAL_PLATFORM,
    recurrence_type: e.recurrence_type,
    day_of_month: e.day_of_month == null ? '' : String(e.day_of_month),
    start_date: e.start_date,
    end_date: e.end_date ?? '',
  }
}

function parseChargeDay(raw: string): ParsedChargeDay {
  const trimmed = raw.trim()
  if (trimmed === '') return { status: 'empty' }
  if (!/^\d+$/.test(trimmed)) return { status: 'invalid' }
  const day = Number(trimmed)
  if (day < CHARGE_DAY_MIN || day > CHARGE_DAY_MAX) return { status: 'invalid' }
  return { status: 'ok', day }
}

function chargeDayForPayload(
  recurrence: ExpenseRecurrence,
  raw: string,
): number | null | undefined {
  if (recurrence !== 'monthly') return null
  const parsed = parseChargeDay(raw)
  if (parsed.status === 'invalid') return undefined
  if (parsed.status === 'empty') return null
  return parsed.day
}

export function ExpensesSheet({
  open,
  onOpenChange,
  expense,
  platforms,
  defaultCurrency,
  onCreate,
  onUpdate,
  isBusy,
}: ExpensesSheetProps) {
  const { lang } = useLanguage()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)
  const [form, setForm] = useState<FormState>(() =>
    expense ? expenseToForm(expense, defaultCurrency) : emptyForm(defaultCurrency),
  )

  const categoryOptions: FilterOption[] = [
    { value: 'payroll', label: t('expensesCatPayroll') },
    { value: 'rent', label: t('expensesCatRent') },
    { value: 'marketing', label: t('expensesCatMarketing') },
    { value: 'logistics', label: t('expensesCatLogistics') },
    { value: 'services', label: t('expensesCatServices') },
    { value: 'suppliers', label: t('expensesCatSuppliers') },
    { value: 'ads', label: t('expensesCatAds') },
    { value: 'other', label: t('expensesCatOther') },
  ]

  const currencyOptions: FilterOption[] = EXPENSE_CURRENCIES.map((code) => ({
    value: code,
    label: code,
  }))

  const platformOptions: FilterOption[] = [
    { value: GLOBAL_PLATFORM, label: t('expensesGlobalPlatform') },
    ...platforms.map((p) => ({ value: p.slug, label: p.name })),
  ]

  const recurrenceOptions: FilterOption[] = [
    { value: 'once', label: t('expensesRecurrenceOnce') },
    { value: 'monthly', label: t('expensesRecurrenceMonthly') },
  ]

  const searchPlaceholder = t('filterSearch')
  const emptyLabel = t('filterComingSoon')
  const datePlaceholder = lang === 'en' ? 'mm/dd/yyyy' : 'dd/mm/aaaa'
  const dateAria = t('expensesDatePickerAria')
  const parsedCharge = parseChargeDay(form.day_of_month)
  const chargeDayInvalid =
    form.recurrence_type === 'monthly' && parsedCharge.status === 'invalid'
  const canSave =
    Boolean(form.label && form.amount && form.start_date) && !isBusy && !chargeDayInvalid

  const handleSave = async () => {
    const amount = parseFloat(form.amount)
    const dayOfMonth = chargeDayForPayload(form.recurrence_type, form.day_of_month)
    if (!form.label || isNaN(amount) || amount <= 0 || !form.start_date) return
    if (dayOfMonth === undefined) return

    const body: ExpenseCreate = {
      label: form.label,
      amount,
      currency: form.currency,
      category: form.category,
      platform: form.platform === GLOBAL_PLATFORM ? null : form.platform,
      recurrence_type: form.recurrence_type,
      day_of_month: dayOfMonth,
      start_date: form.start_date,
      end_date: form.end_date || null,
    }

    if (expense) {
      await onUpdate(expense.id, body)
    } else {
      await onCreate(body)
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <div className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>
              {expense ? t('expensesEditSheetTitle') : t('expensesCreateSheetTitle')}
            </SheetTitle>
          </SheetHeader>

          <SheetBody className="space-y-4">
            <SheetDescription>{t('expensesSheetDescription')}</SheetDescription>

            <FormRow label={t('expensesLabelField')} htmlFor="exp-label">
              <Input
                id="exp-label"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder={t('expensesLabelPlaceholder')}
                disabled={isBusy}
              />
            </FormRow>

            <FormRow label={t('expensesAmountField')} htmlFor="exp-amount">
              <Input
                id="exp-amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                disabled={isBusy}
              />
            </FormRow>

            <FormRow label={t('expensesCurrencyField')}>
              <FilterComboboxSingle
                label={t('expensesCurrencyField')}
                options={currencyOptions}
                value={form.currency}
                onValueChange={(value) =>
                  setForm((f) => ({
                    ...f,
                    currency: normalizeCurrency(value, defaultCurrency),
                  }))
                }
                searchPlaceholder={searchPlaceholder}
                emptyLabel={emptyLabel}
                allowClear={false}
                labelLayout="control"
                popoverSide="bottom"
              />
            </FormRow>

            <FormRow label={t('expensesCategoryField')}>
              <FilterComboboxSingle
                label={t('expensesCategoryField')}
                options={categoryOptions}
                value={form.category}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, category: value as ExpenseCategory }))
                }
                searchPlaceholder={searchPlaceholder}
                emptyLabel={emptyLabel}
                allowClear={false}
                labelLayout="control"
                popoverSide="bottom"
              />
            </FormRow>

            <FormRow label={t('expensesPlatformField')}>
              <FilterComboboxSingle
                label={t('expensesPlatformField')}
                options={platformOptions}
                value={form.platform}
                onValueChange={(value) => setForm((f) => ({ ...f, platform: value }))}
                searchPlaceholder={searchPlaceholder}
                emptyLabel={emptyLabel}
                allowClear={false}
                labelLayout="control"
                popoverSide="bottom"
              />
            </FormRow>

            <FormRow label={t('expensesRecurrenceField')}>
              <FilterComboboxSingle
                label={t('expensesRecurrenceField')}
                options={recurrenceOptions}
                value={form.recurrence_type}
                onValueChange={(value) =>
                  setForm((f) => ({
                    ...f,
                    recurrence_type: value as ExpenseRecurrence,
                    day_of_month: value === 'monthly' ? f.day_of_month : '',
                  }))
                }
                searchPlaceholder={searchPlaceholder}
                emptyLabel={emptyLabel}
                allowClear={false}
                labelLayout="control"
                popoverSide="bottom"
              />
            </FormRow>

            {form.recurrence_type === 'monthly' ? (
              <FormRow label={t('expensesChargeDayField')} htmlFor="exp-charge-day">
                <Input
                  id="exp-charge-day"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={2}
                  value={form.day_of_month}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      day_of_month: sanitizeChargeDayInput(e.target.value, f.day_of_month),
                    }))
                  }
                  placeholder="1"
                  disabled={isBusy}
                  aria-invalid={chargeDayInvalid}
                />
                <p className="mt-1.5 text-xs text-text-tertiary">{t('expensesChargeDayHelp')}</p>
              </FormRow>
            ) : null}

            <FormRow label={t('expensesStartDateField')} htmlFor="exp-start">
              <DatePicker
                id="exp-start"
                value={form.start_date}
                onChange={(value) => setForm((f) => ({ ...f, start_date: value }))}
                placeholder={datePlaceholder}
                openAriaLabel={dateAria}
                disabled={isBusy}
              />
            </FormRow>

            <FormRow label={t('expensesEndDateField')} htmlFor="exp-end">
              <DatePicker
                id="exp-end"
                value={form.end_date}
                onChange={(value) => setForm((f) => ({ ...f, end_date: value }))}
                placeholder={datePlaceholder}
                openAriaLabel={dateAria}
                minDate={form.start_date || undefined}
                disabled={isBusy}
              />
            </FormRow>
          </SheetBody>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isBusy}
            >
              {t('expensesCancelBtn')}
            </Button>
            <Button
              type="button"
              disabled={!canSave}
              loading={isBusy}
              onClick={() => void handleSave()}
            >
              {t('expensesSaveBtn')}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
