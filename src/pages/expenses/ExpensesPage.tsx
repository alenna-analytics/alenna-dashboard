import { useCallback, useMemo, useState } from 'react'

import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, X } from 'lucide-react'

import { useCurrentTenant } from '@/auth/hooks'
import { useMoney } from '@/hooks/use-money'
import { apiFetch } from '@/lib/api'
import { shellT, type ShellStringKey, type ShellStringVars } from '@/lib/i18n/shell-strings'
import type { IntegrationPlatformRow } from '@/lib/types/connectors'
import type { Expense } from '@/lib/types/expenses'
import {
  EXPENSE_CURRENCIES,
  type ExpenseCurrencyCode,
  type ExpensesFilters,
  filterExpenses,
  summarizeExpenses,
} from '@/pages/expenses/expenses-helpers'
import { ExpensesAmountFilter } from '@/pages/expenses/expenses-amount-filter'
import { ExpensesDeleteDialog } from '@/pages/expenses/expenses-delete-dialog'
import { ExpensesSheet } from '@/pages/expenses/expenses-sheet'
import { ExpensesTable } from '@/pages/expenses/expenses-table'
import { useExpenses } from '@/pages/expenses/use-expenses'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useDisplayCurrency } from '@/shell/providers/display-currency-provider'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import { FilterDates } from '@/ui/filters/filter-dates'
import type { FilterOption } from '@/ui/filters/types'
import { KpiCard } from '@/ui/kpi-card'
import { Skeleton } from '@/ui/skeleton'

function formatNativeCurrency(amount: number, currency: string): string {
  const code = currency.trim().toUpperCase() || 'MXN'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function defaultFilters(): ExpensesFilters {
  return {
    startDate: '',
    endDate: '',
    recurrence: '',
    currency: '',
    category: '',
    amountOp: 'gte',
    amountValue: '',
  }
}

function SummaryKpi({
  label,
  value,
  helpText,
  loading,
}: {
  label: string
  value: string
  helpText?: string
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="rounded-md border border-border-default bg-bg-card-strong p-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-7 w-36" />
      </div>
    )
  }

  return (
    <KpiCard
      label={label}
      helpText={helpText}
      value={value}
      vsPriorLabel=""
      priorValueDisplay={null}
      pct={null}
      trend="flat"
      comparisonUnavailable
      showComparison={false}
      valueClassName="text-text-primary"
    />
  )
}

export function ExpensesPage() {
  const { lang } = useLanguage()
  const t = useCallback(
    (key: ShellStringKey, vars?: ShellStringVars) => shellT(lang, key, vars),
    [lang],
  )
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const expenses = useExpenses()
  const { format: formatMoney, baseCurrency, effectiveDisplayCurrency } = useMoney()
  const { latestFx } = useDisplayCurrency()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [filters, setFilters] = useState<ExpensesFilters>(defaultFilters)
  const [searchQ, setSearchQ] = useState('')

  const defaultCurrency: ExpenseCurrencyCode =
    baseCurrency.trim().toUpperCase() === 'USD' ? 'USD' : 'MXN'

  const platformsQuery = useQuery({
    queryKey: ['integration-platforms', tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<IntegrationPlatformRow[]> => {
      const res = await apiFetch(
        '/connectors/integration-platforms',
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as IntegrationPlatformRow[]
    },
  })

  const platforms = useMemo(
    () => (platformsQuery.data ?? []).map((p) => ({ slug: p.slug, name: p.name })),
    [platformsQuery.data],
  )

  const filteredRows = useMemo(
    () =>
      filterExpenses(expenses.query.data ?? [], filters, latestFx, baseCurrency),
    [expenses.query.data, filters, latestFx, baseCurrency],
  )
  const summary = useMemo(
    () =>
      summarizeExpenses(filteredRows, {
        displayCurrency: effectiveDisplayCurrency,
        baseCurrency,
        latestFx,
        startDate: filters.startDate,
        endDate: filters.endDate,
      }),
    [
      filteredRows,
      effectiveDisplayCurrency,
      baseCurrency,
      latestFx,
      filters.startDate,
      filters.endDate,
    ],
  )

  const isLoading = expenses.query.isLoading
  const isFetching = expenses.query.isFetching
  const isBusy =
    expenses.createMutation.isPending ||
    expenses.updateMutation.isPending ||
    expenses.deleteMutation.isPending

  const pickerStrings = {
    applyLabel: t('datePickerApply'),
    todayLabel: t('datePickerToday'),
    placeholder: t('datePickerPlaceholder'),
    presetLast7Days: t('datePickerLast7Days'),
    presetLast30Days: t('datePickerLast30Days'),
    presetLast3Months: t('datePickerLast3Months'),
    presetLast6Months: t('datePickerLast6Months'),
    presetLastYearRolling: t('datePickerLastYearRolling'),
    presetCurrentYear: t('datePickerCurrentYear'),
    presetPreviousYear: t('datePickerPreviousYear'),
  }

  const recurrenceOptions: FilterOption[] = [
    { value: 'once', label: t('expensesRecurrenceOnce') },
    { value: 'monthly', label: t('expensesRecurrenceMonthly') },
  ]

  const currencyOptions: FilterOption[] = EXPENSE_CURRENCIES.map((code) => ({
    value: code,
    label: code,
  }))

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

  const amountOpOptions: FilterOption[] = [
    { value: 'gte', label: t('expensesAmountOpGte') },
    { value: 'lte', label: t('expensesAmountOpLte') },
    { value: 'eq', label: t('expensesAmountOpEq') },
  ]

  const openCreate = () => {
    setEditing(null)
    setSheetOpen(true)
  }

  const openEdit = (expense: Expense) => {
    setEditing(expense)
    setSheetOpen(true)
  }

  const formatAmount = useCallback(
    (amount: number, currency: string) => formatNativeCurrency(amount, currency),
    [],
  )

  const combinedValue =
    summary.combinedDisplay === null
      ? '—'
      : formatMoney(summary.combinedDisplay, {
          nativeCurrency: effectiveDisplayCurrency,
        })

  return (
    <DashboardPage className="flex flex-1 flex-col gap-4">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className={pageTitleClassName}>
              {t('navExpenses')}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary">
              {t('expensesPageSubtitle')}
            </p>
          </div>
          <Button type="button" variant="accent" className="shrink-0" onClick={openCreate}>
            <Plus aria-hidden />
            {t('expensesAddBtn')}
          </Button>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="flex min-w-max items-center gap-2">
            <div className="relative w-72 shrink-0">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t('expensesTableSearchPlaceholder')}
                aria-label={t('expensesTableSearchPlaceholder')}
                className="h-[33px] border-border-default bg-white pl-8 text-xs placeholder:text-xs focus-visible:border-border-emphasis focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searchQ.trim() ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1/2 right-0.5 z-10 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={t('expensesTableSearchClearAria')}
                  onClick={() => setSearchQ('')}
                >
                  <X className="size-4 shrink-0" aria-hidden />
                </Button>
              ) : null}
            </div>
            <FilterDates
              strings={pickerStrings}
              startValue={filters.startDate}
              endValue={filters.endDate}
              onStartChange={(v) => setFilters((f) => ({ ...f, startDate: v ?? '' }))}
              onEndChange={(v) => setFilters((f) => ({ ...f, endDate: v ?? '' }))}
            />
            <FilterComboboxSingle
              label={t('expensesRecurrenceField')}
              options={recurrenceOptions}
              value={filters.recurrence}
              onValueChange={(value) =>
                setFilters((f) => ({
                  ...f,
                  recurrence: (value || '') as ExpensesFilters['recurrence'],
                }))
              }
              searchPlaceholder={t('filterSearch')}
              emptyLabel={t('filterComingSoon')}
              clearAriaLabel={t('filterClear')}
              popoverSide="bottom"
            />
            <FilterComboboxSingle
              label={t('expensesCurrencyField')}
              options={currencyOptions}
              value={filters.currency}
              onValueChange={(value) =>
                setFilters((f) => ({
                  ...f,
                  currency: (value || '') as ExpensesFilters['currency'],
                }))
              }
              searchPlaceholder={t('filterSearch')}
              emptyLabel={t('filterComingSoon')}
              clearAriaLabel={t('filterClear')}
              popoverSide="bottom"
            />
            <FilterComboboxSingle
              label={t('expensesCategoryField')}
              options={categoryOptions}
              value={filters.category}
              onValueChange={(value) =>
                setFilters((f) => ({
                  ...f,
                  category: (value || '') as ExpensesFilters['category'],
                }))
              }
              searchPlaceholder={t('filterSearch')}
              emptyLabel={t('filterComingSoon')}
              clearAriaLabel={t('filterClear')}
              popoverSide="bottom"
            />
            <ExpensesAmountFilter
              label={t('expensesAmountField')}
              filterByLabel={t('expensesAmountFilterBy')}
              op={filters.amountOp}
              amount={filters.amountValue}
              opOptions={amountOpOptions}
              opLabel={t('expensesAmountOpLabel')}
              amountPlaceholder={t('expensesAmountField')}
              applyLabel={t('datePickerApply')}
              clearAriaLabel={t('filterClear')}
              onApply={({ op, amount }) =>
                setFilters((f) => ({ ...f, amountOp: op, amountValue: amount }))
              }
              onClear={() => setFilters((f) => ({ ...f, amountValue: '', amountOp: 'gte' }))}
            />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryKpi
          label={t('expensesSummaryCount')}
          value={String(summary.count)}
          loading={isLoading}
        />
        <SummaryKpi
          label={t('expensesSummaryMxn')}
          value={formatNativeCurrency(summary.mxnTotal, 'MXN')}
          loading={isLoading}
        />
        <SummaryKpi
          label={t('expensesSummaryUsd')}
          value={formatNativeCurrency(summary.usdTotal, 'USD')}
          loading={isLoading}
        />
        <SummaryKpi
          label={t('expensesSummaryCombined', { currency: effectiveDisplayCurrency })}
          value={combinedValue}
          helpText={t('expensesSummaryWindowHint')}
          loading={isLoading}
        />
      </section>

      <section className="min-w-0">
        <ExpensesTable
          rows={filteredRows}
          searchQ={searchQ}
          isLoading={isLoading}
          isFetching={isFetching}
          isBusy={isBusy}
          formatAmount={formatAmount}
          onEdit={openEdit}
          onDelete={(id) => {
            const row = filteredRows.find((r) => r.id === id) ?? null
            setDeleteTarget(row)
          }}
          onCreate={openCreate}
          t={t}
        />
      </section>

      <ExpensesSheet
        key={`${editing?.id ?? 'create'}-${sheetOpen ? 'open' : 'closed'}`}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setEditing(null)
        }}
        expense={editing}
        platforms={platforms}
        defaultCurrency={defaultCurrency}
        onCreate={async (body) => {
          await expenses.createMutation.mutateAsync(body)
        }}
        onUpdate={async (id, body) => {
          await expenses.updateMutation.mutateAsync({ id, ...body })
        }}
        isBusy={isBusy}
      />

      <ExpensesDeleteDialog
        lang={lang}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        deletePending={expenses.deleteMutation.isPending}
        onConfirmDelete={() => {
          if (!deleteTarget) return
          void expenses.deleteMutation
            .mutateAsync(deleteTarget.id)
            .then(() => setDeleteTarget(null))
        }}
      />
    </DashboardPage>
  )
}
