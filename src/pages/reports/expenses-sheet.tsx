import { useState } from 'react'

import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import type { Expense, ExpenseCategory, ExpenseCreate, ExpenseRecurrence } from '@/lib/types/expenses'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'
import { Separator } from '@/ui/separator'

type Platform = { slug: string; name: string }

type ExpensesSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  expenses: Expense[]
  platforms: Platform[]
  onCreate: (body: ExpenseCreate) => Promise<void>
  onUpdate: (id: string, body: Partial<ExpenseCreate>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isBusy?: boolean
}

type FormState = {
  label: string
  amount: string
  currency: string
  category: ExpenseCategory
  platform: string
  recurrence_type: ExpenseRecurrence
  start_date: string
  end_date: string
}

const EMPTY_FORM: FormState = {
  label: '',
  amount: '',
  currency: 'USD',
  category: 'other',
  platform: '',
  recurrence_type: 'once',
  start_date: '',
  end_date: '',
}

function expenseToForm(e: Expense): FormState {
  return {
    label: e.label,
    amount: String(e.amount),
    currency: e.currency,
    category: e.category,
    platform: e.platform ?? '',
    recurrence_type: e.recurrence_type,
    start_date: e.start_date,
    end_date: e.end_date ?? '',
  }
}

export function ExpensesSheet({
  open,
  onOpenChange,
  expenses,
  platforms,
  onCreate,
  onUpdate,
  onDelete,
  isBusy,
}: ExpensesSheetProps) {
  const { lang } = useLanguage()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)

  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const openEdit = (e: Expense) => {
    setEditing(e)
    setForm(expenseToForm(e))
  }

  const handleSave = async () => {
    const amount = parseFloat(form.amount)
    if (!form.label || isNaN(amount) || amount <= 0 || !form.start_date) return

    const body: ExpenseCreate = {
      label: form.label,
      amount,
      currency: form.currency.toUpperCase(),
      category: form.category,
      platform: form.platform || null,
      recurrence_type: form.recurrence_type,
      start_date: form.start_date,
      end_date: form.end_date || null,
    }

    if (editing) {
      await onUpdate(editing.id, body)
    } else {
      await onCreate(body)
    }
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const handleDelete = async (id: string) => {
    await onDelete(id)
    if (editing?.id === id) {
      setEditing(null)
      setForm(EMPTY_FORM)
    }
  }

  const categories: { value: ExpenseCategory; label: string }[] = [
    { value: 'payroll', label: t('expensesCatPayroll') },
    { value: 'rent', label: t('expensesCatRent') },
    { value: 'marketing', label: t('expensesCatMarketing') },
    { value: 'logistics', label: t('expensesCatLogistics') },
    { value: 'services', label: t('expensesCatServices') },
    { value: 'suppliers', label: t('expensesCatSuppliers') },
    { value: 'ads', label: t('expensesCatAds') },
    { value: 'other', label: t('expensesCatOther') },
  ]

  const recurrenceOptions: { value: ExpenseRecurrence; label: string }[] = [
    { value: 'once', label: t('expensesRecurrenceOnce') },
    { value: 'monthly', label: t('expensesRecurrenceMonthly') },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <div className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>{t('expensesSheetTitle')}</SheetTitle>
          </SheetHeader>

          <SheetBody className="flex flex-col gap-0 py-0">
            <SheetDescription className="px-0 pt-4 pb-2">
              {t('expensesSheetDescription')}
            </SheetDescription>

            <div className="flex min-h-0 flex-1 flex-col gap-0 pb-4">
          {/* Expense list */}
          {expenses.length > 0 && (
            <div className="flex flex-col gap-0 px-6 py-4">
              {expenses.map((e, i) => (
                <div key={e.id}>
                  {i > 0 && <Separator className="my-2" />}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{e.label}</p>
                      <p className="text-xs text-text-secondary">
                        {e.currency} {e.amount.toLocaleString()} · {e.recurrence_type}
                        {e.platform ? ` · ${e.platform}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(e)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={isBusy}
                        onClick={() => void handleDelete(e.id)}
                      >
                        {t('expensesDeleteBtn')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Form */}
          <div className="flex flex-col gap-4 px-6 py-4">
            <button
              type="button"
              className="text-left text-xs font-medium text-text-secondary hover:text-text-primary"
              onClick={openNew}
            >
              + {editing ? 'New expense' : 'Fill in the form below'}
            </button>

            <div className="flex flex-col gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="exp-label">{t('expensesLabelField')}</Label>
                <Input
                  id="exp-label"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Shopify monthly plan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="exp-amount">{t('expensesAmountField')}</Label>
                  <Input
                    id="exp-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="exp-currency">{t('expensesCurrencyField')}</Label>
                  <Input
                    id="exp-currency"
                    value={form.currency}
                    maxLength={3}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    placeholder="USD"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>{t('expensesCategoryField')}</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v as ExpenseCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label>{t('expensesPlatformField')}</Label>
                <Select
                  value={form.platform}
                  onValueChange={(v) => setForm((f) => ({ ...f, platform: v ?? '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('expensesGlobalPlatform')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('expensesGlobalPlatform')}</SelectItem>
                    {platforms.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label>{t('expensesRecurrenceField')}</Label>
                <Select
                  value={form.recurrence_type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, recurrence_type: v as ExpenseRecurrence }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recurrenceOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="exp-start">{t('expensesStartDateField')}</Label>
                  <Input
                    id="exp-start"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="exp-end">{t('expensesEndDateField')}</Label>
                  <Input
                    id="exp-end"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
          </div>
          </SheetBody>

          <SheetFooter>
          <Button
            variant="outline"
            onClick={() => {
              setEditing(null)
              setForm(EMPTY_FORM)
            }}
          >
            {t('expensesCancelBtn')}
          </Button>
          <Button
            disabled={!form.label || !form.amount || !form.start_date || isBusy}
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
