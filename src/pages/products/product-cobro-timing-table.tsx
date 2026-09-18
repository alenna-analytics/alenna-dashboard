import { useMemo } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ChannelPlatform } from '@/pages/channels/channels-platform-aggregate'
import type { PlatformSettlementMetrics } from '@/pages/channels/channels-platform-aggregate'
import { SettingsSectionHeader } from '@/pages/configuration/settings-layout'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { EmptyState } from '@/ui/empty-state'

import { productPlatformLabel } from './product-platform-label'
import { ProductPlatformLogoName } from './product-platform-logo-name'

type TimingRow = {
  platform: string
  amount: number
  whenLabel: string
}

const columnHelper = createColumnHelper<TimingRow>()

const TEXT_START_META = {
  headerClassName: '[&>div]:justify-start',
  cellClassName: '[&>div]:justify-start',
} as const

const TEXT_END_META = {
  headerClassName: 'text-right',
  cellClassName: 'text-right tabular-nums',
} as const

function timingCopyForPlatform(
  platform: string,
  t: (key: ShellStringKey) => string,
): string {
  const p = platform.trim().toLowerCase().replace(/_/g, '')
  if (p === 'shopify') return t('productsDetailCobroTimingShopify')
  if (p === 'amazon') return t('productsDetailCobroTimingAmazon')
  if (p === 'mercadolibre' || p === 'meli') return t('productsDetailCobroTimingMeli')
  return t('productsDetailCobroTimingDefault')
}

type ProductCobroTimingTableProps = {
  platforms: ChannelPlatform[]
  metrics: Record<string, PlatformSettlementMetrics>
  /** Preferred pending amount per platform (e.g. estimated cobro neto). */
  pendingByPlatform?: Record<string, number>
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
}

export function ProductCobroTimingTable({
  platforms,
  metrics,
  pendingByPlatform,
  formatMoney,
  t,
}: ProductCobroTimingTableProps) {
  const rows = useMemo((): TimingRow[] => {
    return platforms
      .map((platform) => {
        const m = metrics[platform.slug]
        const amount =
          pendingByPlatform?.[platform.slug] ??
          m?.estimated_payout ??
          0
        return {
          platform: platform.slug,
          amount,
          whenLabel: timingCopyForPlatform(platform.slug, t),
        }
      })
      .filter((row) => row.amount !== 0 || metrics[row.platform])
  }, [metrics, pendingByPlatform, platforms, t])

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'channel',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('homeFilterChannels')} />
        ),
        cell: ({ row }) => (
          <>
            <ProductPlatformLogoName
              platformSlug={row.original.platform}
              t={t}
              className="text-sm"
            />
            <span className="sr-only">
              {productPlatformLabel(row.original.platform, t)}
            </span>
          </>
        ),
        meta: TEXT_START_META,
      }),
      columnHelper.accessor('amount', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsDetailCobroTimingPending')}
            className="justify-end"
          />
        ),
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatMoney(getValue())}</span>
        ),
        meta: TEXT_END_META,
      }),
      columnHelper.accessor('whenLabel', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsDetailCobroTimingWhen')}
          />
        ),
        cell: ({ getValue }) => (
          <span className="text-sm text-text-secondary">{getValue()}</span>
        ),
        meta: TEXT_START_META,
      }),
    ],
    [formatMoney, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.platform,
  })

  if (rows.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <SettingsSectionHeader title={t('productsDetailCobroTimingTitle')} />
      <DataTable
        table={table}
        variant="plain"
        density="compact"
        tableWidth="full"
        isLoading={false}
        isFetching={false}
        hasEverLoaded
        scrollClassName=""
        emptyContent={<EmptyState size="sm" icon="channels" title={t('reportsNoData')} />}
        skeletonRowCount={3}
      />
    </section>
  )
}
