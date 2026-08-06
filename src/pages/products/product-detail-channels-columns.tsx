import type { ColumnDef } from '@tanstack/react-table'
import { MoreVertical, Wallet } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi, StockAlertLevel } from '@/lib/types/catalog'
import { cn } from '@/lib/utils'
import { CopyTextButton } from '@/ui/copy-text-button'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

import { ProductDetailColumnHeaderWithHelp } from './product-detail-column-header-with-help'
import {
  formatListingInventoryDays,
  formatListingVelocityPerDay,
} from './product-detail-listing-channel-format'
import { ProductPlatformLogoName } from './product-platform-logo-name'
import {
  ProductStockAlertBadge,
  ProductStockQuantityCell,
} from './product-stock-alert-ui'

const NUMERIC_CELL_META = {
  headerClassName: '[&>div]:justify-end',
  cellClassName: '[&>div]:justify-end',
} as const
const TEXT_CELL_META = {
  headerClassName: '[&>div]:justify-start',
  cellClassName: '[&>div]:justify-start',
} as const

const SKU_TRUNCATE_LEN = 12

function truncateSku(sku: string): string {
  if (sku.length <= SKU_TRUNCATE_LEN) return sku
  return `${sku.slice(0, SKU_TRUNCATE_LEN)}…`
}

function alertRank(level: StockAlertLevel): number {
  if (level === 'out') return 0
  if (level === 'low') return 1
  return 2
}

export function sortListingsByStockAlert(listings: ProductListingApi[]): ProductListingApi[] {
  return [...listings].sort((a, b) => {
    const d = alertRank(a.stock_alert) - alertRank(b.stock_alert)
    if (d !== 0) return d
    return a.platform.localeCompare(b.platform)
  })
}

export function createProductDetailChannelsColumns(
  t: (key: ShellStringKey) => string,
  fmtBase: (value: number) => string,
  options?: {
    onViewSettlement?: (listing: ProductListingApi) => void
    preset?: 'full' | 'platform-payment'
  },
): ColumnDef<ProductListingApi>[] {
  const preset = options?.preset ?? 'full'
  const showInventoryMetrics = preset === 'full'
  const showActions = preset === 'full' && Boolean(options?.onViewSettlement)

  const columns: ColumnDef<ProductListingApi>[] = [
    {
      id: 'platform',
      accessorKey: 'platform',
      meta: TEXT_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsDetailListingColChannel')} />
      ),
      cell: ({ row }) => (
        <ProductPlatformLogoName
          platformSlug={row.original.platform}
          t={t}
          className="max-w-56 text-sm text-text-primary"
        />
      ),
    },
    {
      id: 'platform_sku',
      accessorKey: 'platform_sku',
      meta: {
        ...TEXT_CELL_META,
        headerClassName: 'min-w-[10rem]',
        cellClassName: 'min-w-[10rem] [&>div]:justify-start',
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsDetailListingColSku')} />
      ),
      cell: ({ row }) => {
        const sku = row.original.platform_sku
        return (
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate font-mono text-sm leading-normal" title={sku}>
              {truncateSku(sku)}
            </span>
            <CopyTextButton
              text={sku}
              copiedLabel={t('productsCopyFeedback')}
              copyAriaLabel={t('productsTableCopySku')}
            />
          </div>
        )
      },
    },
  ]

  if (showInventoryMetrics) {
    columns.push(
      {
        id: 'stock_quantity',
        accessorKey: 'stock_quantity',
        meta: NUMERIC_CELL_META,
        header: ({ column }) => (
          <DataTableColumnHeader
            className="justify-end"
            column={column}
            title={t('productsDetailListingColStock')}
          />
        ),
        cell: ({ row }) => <ProductStockQuantityCell quantity={row.original.stock_quantity} />,
      },
      {
        id: 'stock_alert',
        accessorKey: 'stock_alert',
        meta: TEXT_CELL_META,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('productsDetailListingColAlert')} />
        ),
        cell: ({ row }) => <ProductStockAlertBadge level={row.original.stock_alert} t={t} />,
      },
      {
        id: 'velocity_units_per_day_90d',
        accessorKey: 'velocity_units_per_day_90d',
        meta: NUMERIC_CELL_META,
        header: () => (
          <div className="flex w-full min-w-0 items-center justify-end text-sm font-semibold text-text-secondary">
            <ProductDetailColumnHeaderWithHelp
              title={t('productsDetailListingColVelocityPerDay')}
              helpText={t('productsDetailListingColVelocityPerDayHelp')}
            />
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatListingVelocityPerDay(row.original.velocity_units_per_day_90d)}
          </span>
        ),
      },
      {
        id: 'inventory_days',
        accessorKey: 'inventory_days',
        meta: NUMERIC_CELL_META,
        header: ({ column }) => (
          <DataTableColumnHeader
            className="justify-end"
            column={column}
            title={t('productsDetailListingColInventoryDays')}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">{formatListingInventoryDays(row.original, t)}</span>
        ),
      },
    )
  }

  columns.push(
    {
      id: 'period_sales',
      accessorKey: 'period_sales',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColSales')}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{fmtBase(row.original.period_sales)}</span>
      ),
    },
    {
      id: 'period_orders',
      accessorKey: 'period_orders',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColOrders')}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.original.period_orders}</span>
      ),
    },
    {
      id: 'period_estimated_payout',
      accessorFn: (row) => row.period_settlement?.estimated_payout ?? null,
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColEstimatedPayout')}
        />
      ),
      cell: ({ row }) => {
        const payout = row.original.period_settlement?.estimated_payout
        if (payout === null || payout === undefined) {
          return <span className="text-sm text-text-tertiary">—</span>
        }
        return <span className="text-sm tabular-nums">{fmtBase(payout)}</span>
      },
    },
    {
      id: 'period_units_sold',
      accessorKey: 'period_units_sold',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColUnits')}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.original.period_units_sold}</span>
      ),
    },
  )

  if (showActions) {
    columns.push({
      id: 'actions',
      meta: {
        headerClassName: '[&>div]:justify-end',
        cellClassName: '[&>div]:justify-end',
      },
      header: () => null,
      cell: ({ row }) => {
        const listing = row.original
        const hasSettlement = listing.period_settlement !== null
        if (!hasSettlement) return null
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-full border border-transparent text-foreground outline-none',
                'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30',
              )}
              aria-label={t('productsDetailListingActionsAria')}
              onClick={(event) => event.stopPropagation()}
            >
              <MoreVertical className="size-4 shrink-0" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => options?.onViewSettlement?.(listing)}>
                <Wallet className="size-4 shrink-0" aria-hidden />
                {t('productsDetailListingViewSettlement')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    })
  }

  return columns
}
