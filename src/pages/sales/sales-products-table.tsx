import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { TopProductRow } from '@/lib/types/reports'
import { truncateListingLabel } from '@/pages/products/product-detail-listing-channel-format'
import { ProductTableThumb } from '@/pages/products/product-table-thumb'
import { CopyTextButton } from '@/ui/copy-text-button'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { TableEmptyCell } from '@/ui/data-table/table-empty-cell'
import { EmptyState } from '@/ui/empty-state'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'
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
      columnHelper.display({
        id: 'image',
        header: () => t('productsColImage'),
        cell: ({ row }) => (
          <ProductTableThumb url={row.original.image_url} alt={row.original.title} />
        ),
        meta: {
          headerClassName: 'w-12 min-w-12 max-w-12',
          cellClassName: 'w-12 min-w-12 max-w-12',
        },
      }),
      columnHelper.accessor('title', {
        id: 'product',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('salesProductColumn')} />
        ),
        cell: ({ row }) => (
          <Link
            to={`/dashboard/products/${row.original.product_id}`}
            className="line-clamp-2 max-w-full break-words text-sm font-normal text-primary hover:underline"
            title={row.original.title}
          >
            {row.original.title}
          </Link>
        ),
        meta: {
          headerClassName: 'min-w-[17rem] max-w-[min(30rem,42vw)]',
          cellClassName:
            'min-w-[17rem] max-w-[min(30rem,42vw)] overflow-hidden align-middle whitespace-normal',
        },
      }),
      columnHelper.accessor('internal_sku', {
        id: 'sku',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('salesSkuColumn')} />
        ),
        cell: ({ getValue }) => {
          const sku = getValue()?.trim()
          if (!sku) {
            return <TableEmptyCell />
          }
          return (
            <div className="flex min-w-0 items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="min-w-0 truncate font-mono text-sm leading-normal text-text-secondary">
                    {truncateListingLabel(sku)}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-[min(20rem,calc(100vw-2rem))] break-all font-mono text-xs leading-snug"
                >
                  {sku}
                </TooltipContent>
              </Tooltip>
              <CopyTextButton
                text={sku}
                copiedLabel={t('productsCopyFeedback')}
                failedLabel={t('productsCopyFailed')}
                copyAriaLabel={t('productsTableCopySku')}
              />
            </div>
          )
        },
        meta: {
          headerClassName: 'w-24 min-w-24 max-w-24',
          cellClassName: 'w-24 min-w-24 max-w-24 overflow-hidden align-middle whitespace-normal',
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
      columnHelper.accessor('order_count', {
        id: 'orders',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('channelsMetricOrders')}
            className="justify-end"
          />
        ),
        cell: ({ getValue }) => (
          <span className="font-numeric tabular-nums">{(getValue() ?? 0).toLocaleString()}</span>
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
        emptyContent={<EmptyState icon="sales" title={t('homeTopProductsEmpty')} />}
        skeletonRowCount={8}
        scrollClassName="max-h-[28rem] overflow-auto"
      />
    </SectionContainer>
  )
}
