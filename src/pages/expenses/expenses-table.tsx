import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { MoreVertical } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { Expense } from '@/lib/types/expenses'
import {
  categoryLabelKey,
  recurrenceLabelKey,
} from '@/pages/expenses/expenses-helpers'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

const columnHelper = createColumnHelper<Expense>()

type ExpensesTableProps = {
  rows: Expense[]
  isLoading: boolean
  isFetching: boolean
  isBusy: boolean
  formatAmount: (amount: number, currency: string) => string
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
  t: (key: ShellStringKey) => string
}

export function ExpensesTable({
  rows,
  isLoading,
  isFetching,
  isBusy,
  formatAmount,
  onEdit,
  onDelete,
  t,
}: ExpensesTableProps) {
  const [search, setSearch] = useState('')

  const columns = useMemo(
    () => [
      columnHelper.accessor('label', {
        id: 'label',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('expensesLabelField')} />
        ),
        cell: ({ getValue }) => (
          <span className="font-medium text-text-primary">{getValue()}</span>
        ),
        filterFn: 'includesString',
      }),
      columnHelper.accessor('amount', {
        id: 'amount',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('expensesAmountField')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => (
          <span className="w-full text-right font-numeric tabular-nums">
            {formatAmount(row.original.amount, row.original.currency)}
          </span>
        ),
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
        enableColumnFilter: false,
      }),
      columnHelper.accessor('currency', {
        id: 'currency',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('expensesCurrencyField')} />
        ),
        cell: ({ getValue }) => (
          <span className="font-numeric tabular-nums text-text-secondary">
            {getValue().toUpperCase()}
          </span>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('category', {
        id: 'category',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('expensesCategoryField')} />
        ),
        cell: ({ getValue }) => t(categoryLabelKey(getValue())),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('recurrence_type', {
        id: 'recurrence',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('expensesRecurrenceField')} />
        ),
        cell: ({ getValue }) => t(recurrenceLabelKey(getValue())),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('start_date', {
        id: 'start',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('expensesStartDateField')} />
        ),
        cell: ({ getValue }) => (
          <span className="font-numeric tabular-nums text-text-secondary">{getValue()}</span>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('end_date', {
        id: 'end',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('expensesEndDateField')} />
        ),
        cell: ({ getValue }) => (
          <span className="font-numeric tabular-nums text-text-secondary">
            {getValue() ?? '—'}
          </span>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">{t('expensesActionsColumn')}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-full border border-transparent text-foreground outline-none',
                  'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30',
                )}
                aria-label={t('expensesActionsColumn')}
              >
                <MoreVertical className="size-4 shrink-0" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t('expensesActionsColumn')}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onEdit(row.original)}>
                    {t('expensesEditBtn')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={isBusy}
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(row.original.id)}
                  >
                    {t('expensesDeleteBtn')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      }),
    ],
    [formatAmount, isBusy, onDelete, onEdit, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: rows,
    columns,
    state: {
      globalFilter: search,
    },
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? '')
        .trim()
        .toLowerCase()
      if (!q) return true
      const expense = row.original
      return (
        expense.label.toLowerCase().includes(q) ||
        expense.currency.toLowerCase().includes(q) ||
        expense.category.toLowerCase().includes(q)
      )
    },
    enableSorting: false,
  })

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      isFetching={isFetching}
      hasEverLoaded={!isLoading || rows.length > 0}
      emptyContent={
        <p className="px-4 py-8 text-center text-sm text-text-secondary">{t('expensesEmpty')}</p>
      }
      skeletonRowCount={8}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: t('expensesTableSearchPlaceholder'),
        ariaLabel: t('expensesTableSearchPlaceholder'),
        clearAriaLabel: t('expensesTableSearchClearAria'),
      }}
    />
  )
}
