import type { ColumnDef } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { CogsBulkLoadItemApi } from '@/lib/types/cogs-load'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { TableEmptyCell } from '@/ui/data-table/table-empty-cell'

import { computeCogsTotal } from '../product-cost-breakdown'
import { distinctVariantLabel } from './cogs-load-product-label'

const NUMERIC_CELL_META = {
  headerClassName: '[&>div]:justify-end',
  cellClassName: '[&>div]:justify-end',
} as const

const TEXT_CELL_META = {
  headerClassName: '[&>div]:justify-start',
  cellClassName: '[&>div]:justify-start',
} as const

type CogsLoadDetailColumnLabels = {
  t: (key: ShellStringKey) => string
  formatCost: (value: number) => string
}

function loadItemCogsTotal(item: CogsBulkLoadItemApi): number | null {
  if (item.supplier_price == null) return item.computed_total
  return computeCogsTotal({
    supplierPrice: item.supplier_price,
    freight: { mode: 'fixed', value: item.freight_value ?? 0 },
    duties: { mode: 'fixed', value: 0 },
    packagingValue: item.packaging_value ?? 0,
  })
}

function renderCostCell(value: number | null, formatCost: (value: number) => string) {
  if (value == null) return <TableEmptyCell />
  return <span className="tabular-nums">{formatCost(value)}</span>
}

export function createCogsLoadDetailColumns({
  t,
  formatCost,
}: CogsLoadDetailColumnLabels): ColumnDef<CogsBulkLoadItemApi>[] {
  return [
    {
      id: 'product',
      accessorFn: (row) => row.parent_title || row.title,
      meta: {
        ...TEXT_CELL_META,
        headerClassName: 'min-w-[12rem]',
        cellClassName: 'min-w-[12rem] [&>div]:justify-start',
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsBulkCogsColProduct')} />
      ),
      cell: ({ row }) => {
        const title = row.original.parent_title || row.original.title
        return (
          <span className="truncate font-medium text-text-primary" title={title}>
            {title}
          </span>
        )
      },
    },
    {
      id: 'variant',
      accessorFn: (row) => distinctVariantLabel(row.parent_title || row.title, row.variant_label),
      meta: TEXT_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsBulkCogsColVariant')} />
      ),
      cell: ({ row }) => {
        const variant = distinctVariantLabel(
          row.original.parent_title || row.original.title,
          row.original.variant_label,
        )
        if (!variant) return <TableEmptyCell />
        return (
          <span className="truncate text-text-secondary" title={variant}>
            {variant}
          </span>
        )
      },
    },
    {
      accessorKey: 'internal_sku',
      meta: TEXT_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsColSku')} />
      ),
      cell: ({ row }) => {
        const sku = row.original.internal_sku?.trim()
        if (!sku) return <TableEmptyCell />
        return <span className="truncate text-text-secondary">{sku}</span>
      },
    },
    {
      accessorKey: 'computed_total',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsBulkCogsColCurrent')}
        />
      ),
      cell: ({ row }) => renderCostCell(row.original.computed_total, formatCost),
    },
    {
      accessorKey: 'supplier_price',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsBulkCogsColSupplier')}
        />
      ),
      cell: ({ row }) => renderCostCell(row.original.supplier_price, formatCost),
    },
    {
      accessorKey: 'freight_value',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsCostEditorFreight')}
        />
      ),
      cell: ({ row }) => renderCostCell(row.original.freight_value, formatCost),
    },
    {
      accessorKey: 'packaging_value',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsBulkCogsColShipping')}
        />
      ),
      cell: ({ row }) => renderCostCell(row.original.packaging_value, formatCost),
    },
    {
      id: 'cogs_total',
      accessorFn: (row) => loadItemCogsTotal(row),
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsCostEditorTotal')}
        />
      ),
      cell: ({ row }) => renderCostCell(loadItemCogsTotal(row.original), formatCost),
    },
  ]
}
