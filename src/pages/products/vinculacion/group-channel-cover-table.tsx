import { useMemo } from 'react'
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkGroupApi, ProductLinkGroupMemberApi } from '@/lib/types/product-links'
import { cn } from '@/lib/utils'
import { SettingsSectionHeader } from '@/pages/configuration/settings-layout'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { TableEmptyCell } from '@/ui/data-table/table-empty-cell'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'
import { StatusPill } from '@/ui/status-pill'

import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { productPlatformLabel } from '../product-platform-label'
import { buildChannelCoverRows, type ChannelCoverRow } from './group-channel-cover'
import { formatStockoutDate } from './group-weekly-sales'

type ShellT = (key: ShellStringKey) => string

const TEXT_START_META = {
  headerClassName: '[&>div]:justify-start',
  cellClassName: 'h-auto py-2 [&>div]:justify-start [&>div]:items-start',
} as const

const TEXT_END_META = {
  headerClassName: 'text-right',
  cellClassName: 'h-auto py-2 text-right tabular-nums [&>div]:items-center',
} as const

const columnHelper = createColumnHelper<ChannelCoverRow>()

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value == null ? match : String(value)
  })
}

function publicationSubtitle(row: ChannelCoverRow, t: ShellT): string {
  const label = fill(
    t(row.publicationCount === 1
      ? 'productsGroupInventoryPublication'
      : 'productsGroupInventoryPublications'),
    { count: row.publicationCount },
  )
  if (row.memberStocks.length < 2) return label
  const stocks = row.memberStocks
    .map((stock) => (stock == null ? '—' : stock.toLocaleString()))
    .join(' + ')
  return `${label} · ${stocks}`
}

function formatVelocity(value: number | null): string | null {
  if (value == null || value <= 0) return null
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDays(value: number | null): string | null {
  if (value == null) return null
  return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function GroupChannelCoverTable({
  group,
  members,
  lang,
  t,
  today,
  isFetching = false,
}: {
  group: ProductLinkGroupApi
  members: ProductLinkGroupMemberApi[]
  lang: string
  t: ShellT
  today: Date
  isFetching?: boolean
}) {
  const rows = useMemo(
    () => buildChannelCoverRows(group, members, today),
    [group, members, today],
  )

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'channel',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('productsGroupInventoryChannel')} />
        ),
        cell: ({ row }) => {
          const slug = row.original.platform.trim().toLowerCase()
          const logoSrc = slug ? INTEGRATION_UI[slug]?.logoSrc : undefined
          const title = row.original.isTotal
            ? t('channelsColTotal')
            : productPlatformLabel(row.original.platform, t)
          const detail = row.original.isTotal
            ? t('productsGroupInventoryTotalHint')
            : publicationSubtitle(row.original, t)
          return (
            <span className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-2 gap-y-0.5">
              {row.original.isTotal || !logoSrc ? (
                <span className="size-5" aria-hidden />
              ) : (
                <img
                  src={logoSrc}
                  alt=""
                  className="mt-0.5 size-5 shrink-0 object-contain"
                  draggable={false}
                />
              )}
              <span
                className="truncate text-sm font-semibold leading-5 text-text-primary"
              >
                {title}
              </span>
              <span className="col-start-2 text-xs leading-4 text-text-tertiary">{detail}</span>
            </span>
          )
        },
        meta: TEXT_START_META,
      }),
      columnHelper.accessor('stock', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsDetailInventoryStock')}
            className="justify-end"
          />
        ),
        cell: ({ getValue, row }) => {
          if (!row.original.stockKnown) return <TableEmptyCell />
          return (
            <span className={cn(row.original.isTotal && 'font-semibold')}>
              {getValue().toLocaleString()}
            </span>
          )
        },
        meta: TEXT_END_META,
      }),
      columnHelper.accessor('velocity', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsGroupInventoryVelocityPerDay')}
            className="justify-end"
          />
        ),
        cell: ({ getValue, row }) => {
          const formatted = formatVelocity(getValue())
          if (!formatted) return <TableEmptyCell />
          return (
            <span className={cn(row.original.isTotal && 'font-semibold')}>{formatted}</span>
          )
        },
        meta: TEXT_END_META,
      }),
      columnHelper.accessor('inventoryDays', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsGroupInventoryDays')}
            className="justify-end"
          />
        ),
        cell: ({ getValue, row }) => {
          const formatted = formatDays(getValue())
          if (!formatted) return <TableEmptyCell />
          return (
            <span className={cn(row.original.isTotal && 'font-semibold')}>{formatted}</span>
          )
        },
        meta: TEXT_END_META,
      }),
      columnHelper.accessor('stockoutOn', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsGroupInventoryStockout')}
            className="justify-end"
          />
        ),
        cell: ({ getValue }) => {
          const date = getValue()
          if (!date) return <TableEmptyCell />
          return formatStockoutDate(date, lang)
        },
        meta: TEXT_END_META,
      }),
      columnHelper.display({
        id: 'reorder',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsGroupInventoryReorder')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          if (row.original.reorderPoint != null) {
            return (
              <span className={cn(row.original.isTotal && 'font-semibold')}>
                {row.original.reorderPoint.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
            )
          }
          return (
            <span className="text-text-tertiary">{t('productsGroupInventoryMissingLeadTime')}</span>
          )
        },
        meta: TEXT_END_META,
      }),
      columnHelper.display({
        id: 'alert',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsDetailInventoryAlert')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          const alert = row.original.alert
          if (alert === 'unknown') return <TableEmptyCell />
          return (
            <div className="flex w-full justify-end">
              <StatusPill variant={alert === 'critical' ? 'error' : 'success'}>
                {alert === 'critical'
                  ? t('productsGroupInventoryAlertCritical')
                  : t('productsGroupInventoryAlertNormal')}
              </StatusPill>
            </div>
          )
        },
        meta: TEXT_END_META,
      }),
    ],
    [lang, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <section className="mt-6 flex flex-col gap-3">
      <SettingsSectionHeader
        title={t('productsDetailInventoryByChannelTitle')}
        description={t('productsGroupInventoryVelocityCaption')}
      />
      {isFetching && rows.length === 0 ? (
        <Skeleton className="h-32 w-full" aria-hidden />
      ) : (
        <DataTable
          table={table}
          variant="plain"
          density="compact"
          tableWidth="full"
          isLoading={false}
          isFetching={isFetching}
          hasEverLoaded
          scrollClassName=""
          emptyContent={<EmptyState size="sm" icon="channels" title={t('reportsNoData')} />}
          skeletonRowCount={3}
        />
      )}
    </section>
  )
}
