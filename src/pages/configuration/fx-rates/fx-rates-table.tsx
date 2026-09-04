import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type PaginationState,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { DataTablePagination } from '@/ui/data-table/data-table-pagination'
import { EmptyState } from '@/ui/empty-state'

import { fxPairKey, parseFxRate, type FxRateRow } from './fx-rates-types'

const PAGE_SIZE = 10
const columnHelper = createColumnHelper<FxRateRow>()

type FxRatesTableProps = {
  rows: FxRateRow[]
  isLoading: boolean
  isFetching: boolean
  t: (key: ShellStringKey) => string
}

export function FxRatesTable({ rows, isLoading, isFetching, t }: FxRatesTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor('rate_date', {
        id: 'date',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('workspaceConfigFxRatesColDate')} />
        ),
        cell: ({ getValue }) => (
          <span className="tabular-nums text-text-primary">{getValue()}</span>
        ),
        meta: {
          headerClassName: 'min-w-[8rem]',
          cellClassName: 'min-w-[8rem]',
        },
      }),
      columnHelper.display({
        id: 'pair',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('workspaceConfigFxRatesColPair')} />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-text-primary">{fxPairKey(row.original)}</span>
        ),
        meta: {
          headerClassName: 'min-w-[7rem]',
          cellClassName: 'min-w-[7rem]',
        },
      }),
      columnHelper.accessor('rate', {
        id: 'rate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('workspaceConfigFxRatesColRate')} />
        ),
        cell: ({ getValue }) => {
          const rate = parseFxRate(getValue())
          return (
            <span className="tabular-nums text-text-primary">
              {rate === null
                ? '—'
                : rate.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
            </span>
          )
        },
        meta: {
          headerClassName: 'min-w-[8rem]',
          cellClassName: 'min-w-[8rem]',
        },
      }),
    ],
    [t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: rows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      isFetching={isFetching}
      hasEverLoaded={!isLoading || rows.length > 0}
      emptyContent={<EmptyState icon="billing" title={t('workspaceConfigFxRatesEmpty')} />}
      skeletonRowCount={8}
      scrollClassName="max-h-[28rem] overflow-auto"
      density="compact"
      tableWidth="full"
      footer={
        rows.length > PAGE_SIZE ? (
          <DataTablePagination
            table={table}
            labels={{
              ariaPrevious: t('productsTablePrev'),
              ariaNext: t('productsTableNext'),
              pageStatus: (page, totalPages) =>
                `${t('productsTablePageLabel')} ${page} ${t('productsTableOf')} ${totalPages}`,
              pageButtonAria: (page, totalPages) =>
                `${t('productsTablePageLabel')} ${page} ${t('productsTableOf')} ${totalPages}`,
              goToPageLabel: t('productsTableGoToPage'),
              goToPageAria: t('productsTableGoToPageAria'),
            }}
          />
        ) : null
      }
    />
  )
}
