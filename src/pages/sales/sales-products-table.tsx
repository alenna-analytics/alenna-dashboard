import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { TopProductRow } from '@/lib/types/reports'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { EmptyState } from '@/ui/empty-state'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'

const columnHelper = createColumnHelper<TopProductRow>()

type SalesProductsTableProps = {
  rows: TopProductRow[]
  isLoading: boolean
  isFetching: boolean
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
}

export function SalesProductsTable({
  rows,
  isLoading,
  isFetching,
  formatMoney,
  t,
}: SalesProductsTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        id: 'product',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('salesProductColumn')} />
        ),
        cell: ({ row }) => (
          <Link
            to={`/dashboard/products/${row.original.product_id}`}
            className="block min-w-0 max-w-full truncate font-medium text-text-primary underline-offset-2 hover:text-[var(--country-green-base)] hover:underline"
            title={row.original.title}
          >
            {row.original.title}
          </Link>
        ),
        meta: {
          headerClassName: 'w-56 min-w-40 max-w-56',
          cellClassName: 'w-56 min-w-40 max-w-56 overflow-hidden',
        },
      }),
      columnHelper.accessor('internal_sku', {
        id: 'sku',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('salesSkuColumn')} />
        ),
        cell: ({ getValue }) => {
          const sku = getValue()?.trim()
          return (
            <span className="font-numeric text-sm tabular-nums text-text-secondary">
              {sku || '—'}
            </span>
          )
        },
      }),
      columnHelper.accessor('gross_revenue', {
        id: 'gross',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsGrossRevenue')}
            className="justify-end"
          />
        ),
        cell: ({ getValue }) => (
          <span className="font-numeric tabular-nums">{formatMoney(getValue())}</span>
        ),
        meta: {
          headerClassName: '[&>div]:justify-end',
          cellClassName: '[&>div]:justify-end',
        },
      }),
      columnHelper.accessor('net_revenue', {
        id: 'net',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsNetRevenue')}
            className="justify-end"
          />
        ),
        cell: ({ getValue }) => (
          <span className="font-numeric tabular-nums">{formatMoney(getValue() ?? 0)}</span>
        ),
        meta: {
          headerClassName: '[&>div]:justify-end',
          cellClassName: '[&>div]:justify-end',
        },
      }),
      columnHelper.accessor('units_sold', {
        id: 'units',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('salesUnitsColumn')}
            className="justify-end"
          />
        ),
        cell: ({ getValue }) => (
          <span className="font-numeric tabular-nums">{getValue().toLocaleString()}</span>
        ),
        meta: {
          headerClassName: '[&>div]:justify-end',
          cellClassName: '[&>div]:justify-end',
        },
      }),
      columnHelper.accessor('gross_margin_pct', {
        id: 'margin',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsKpiMargenBrutoPct')}
            className="justify-end"
          />
        ),
        cell: ({ getValue }) => (
          <span className="font-numeric tabular-nums">{getValue().toFixed(1)}%</span>
        ),
        meta: {
          headerClassName: '[&>div]:justify-end',
          cellClassName: '[&>div]:justify-end',
        },
      }),
    ],
    [formatMoney, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <SectionContainer className="overflow-hidden">
      <SectionHeader
        title={t('salesProductsTableTitle')}
        description={t('salesProductsTableSubtitle')}
      />
      <DataTable
        table={table}
        isLoading={isLoading}
        isFetching={isFetching}
        hasEverLoaded={!isLoading || rows.length > 0}
        emptyContent={<EmptyState title={t('homeTopProductsEmpty')} />}
        skeletonRowCount={8}
        scrollClassName="max-h-[28rem] overflow-auto"
      />
    </SectionContainer>
  )
}
