/* eslint-disable react-refresh/only-export-components -- column defs + listing cell helpers */
import type { ColumnDef } from '@tanstack/react-table'
import { MoreVertical, Wallet } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi, StockAlertLevel } from '@/lib/types/catalog'
import { cn } from '@/lib/utils'
import { CopyTextButton } from '@/ui/copy-text-button'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

import { ProductDetailColumnHeaderWithHelp } from './product-detail-column-header-with-help'
import {
  formatListingInventoryDays,
  formatListingPublicationDisplay,
  formatListingVelocityPerDay,
  resolveListingVariantId,
  truncateListingLabel,
} from './product-detail-listing-channel-format'
import { ProductPlatformLogoName } from './product-platform-logo-name'
import {
  ProductStockAlertBadge,
  ProductStockQuantityCell,
} from './product-stock-alert-ui'

function ProductListingSharedStockCell({
  t,
}: {
  t: (key: ShellStringKey) => string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-sm text-text-tertiary">{t('productsDetailListingSharedStock')}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-left text-xs leading-snug">
        {t('productsDetailListingSharedStockHelp')}
      </TooltipContent>
    </Tooltip>
  )
}

const NUMERIC_CELL_META = {
  headerClassName: '[&>div]:justify-end',
  cellClassName: '[&>div]:justify-end',
} as const
const TEXT_CELL_META = {
  headerClassName: '[&>div]:justify-start',
  cellClassName: '[&>div]:justify-start',
} as const

const LISTING_TEXT_TRUNCATE_LEN = 20

function truncateListingText(value: string): string {
  if (value.length <= LISTING_TEXT_TRUNCATE_LEN) return value
  return `${value.slice(0, LISTING_TEXT_TRUNCATE_LEN)}…`
}

function ProductListingSkuLabel({ sku }: { sku: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="min-w-0 truncate font-mono text-sm leading-normal">{truncateListingText(sku)}</span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[min(20rem,calc(100vw-2rem))] break-all font-mono text-xs leading-snug"
      >
        {sku}
      </TooltipContent>
    </Tooltip>
  )
}

function ProductListingPublicationCell({
  listing,
  t,
}: {
  listing: ProductListingApi
  t: (key: ShellStringKey) => string
}) {
  const { variantLabel, variantTooltip, listPrice } = formatListingPublicationDisplay(listing)
  const copyText = variantTooltip ?? variantLabel ?? listPrice

  if (!variantLabel && !listPrice) {
    return <span className="text-sm text-text-tertiary">—</span>
  }

  if (!variantLabel && listPrice) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <span className="min-w-0 truncate text-sm tabular-nums text-text-secondary" title={listPrice}>
          {listPrice}
        </span>
        {copyText ? (
          <CopyTextButton
            text={copyText}
            copiedLabel={t('productsCopyFeedback')}
            failedLabel={t('productsCopyFailed')}
            copyAriaLabel={t('productsDetailListingCopyPublication')}
          />
        ) : null}
      </div>
    )
  }

  const displayVariant = variantLabel ? truncateListingLabel(variantLabel) : null

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      {displayVariant ? (
        <div className="flex min-w-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="min-w-0 truncate font-mono text-sm leading-normal text-text-primary">
                {displayVariant}
              </span>
            </TooltipTrigger>
            {variantTooltip ? (
              <TooltipContent
                side="top"
                className="max-w-[min(20rem,calc(100vw-2rem))] break-all font-mono text-xs leading-snug"
              >
                {variantTooltip}
              </TooltipContent>
            ) : null}
          </Tooltip>
          {copyText ? (
            <CopyTextButton
              text={copyText}
              copiedLabel={t('productsCopyFeedback')}
              failedLabel={t('productsCopyFailed')}
              copyAriaLabel={t('productsDetailListingCopyPublication')}
            />
          ) : null}
        </div>
      ) : null}
      {listPrice ? (
        <span className="truncate text-xs tabular-nums text-text-tertiary" title={listPrice}>
          {listPrice}
        </span>
      ) : null}
    </div>
  )
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
    const platformCmp = a.platform.localeCompare(b.platform)
    if (platformCmp !== 0) return platformCmp
    const skuCmp = a.platform_sku.localeCompare(b.platform_sku)
    if (skuCmp !== 0) return skuCmp
    return (a.platform_variant_id ?? '').localeCompare(b.platform_variant_id ?? '')
  })
}

export function createProductDetailChannelsColumns(
  t: (key: ShellStringKey) => string,
  fmtBase: (value: number) => string,
  options?: {
    onViewSettlement?: (listing: ProductListingApi) => void
    preset?: 'full' | 'platform-payment'
    sharedStockListingIds?: Set<string>
  },
): ColumnDef<ProductListingApi>[] {
  const preset = options?.preset ?? 'full'
  const showInventoryMetrics = preset === 'full'
  const showActions = preset === 'full' && Boolean(options?.onViewSettlement)
  const sharedStockIds = options?.sharedStockListingIds ?? new Set<string>()

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
            <ProductListingSkuLabel sku={sku} />
            <CopyTextButton
              text={sku}
              copiedLabel={t('productsCopyFeedback')}
              failedLabel={t('productsCopyFailed')}
              copyAriaLabel={t('productsTableCopySku')}
            />
          </div>
        )
      },
    },
    {
      id: 'platform_publication',
      accessorFn: (row) => resolveListingVariantId(row) ?? row.platform_price ?? null,
      meta: {
        ...TEXT_CELL_META,
        headerClassName: 'min-w-[7rem]',
        cellClassName: 'min-w-[7rem] [&>div]:justify-start',
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsDetailListingColPublication')} />
      ),
      cell: ({ row }) => <ProductListingPublicationCell listing={row.original} t={t} />,
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
        cell: ({ row }) =>
          sharedStockIds.has(row.original.id) ? (
            <ProductListingSharedStockCell t={t} />
          ) : (
            <ProductStockQuantityCell quantity={row.original.stock_quantity} />
          ),
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
          <div className="flex w-full min-w-0 items-center justify-end text-xs font-medium text-muted-foreground">
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
