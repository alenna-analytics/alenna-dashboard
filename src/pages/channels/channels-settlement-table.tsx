import { useMemo } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ChannelPlatform } from '@/pages/channels/channels-platform-aggregate'
import type { PlatformSettlementMetrics } from '@/pages/channels/channels-platform-aggregate'
import { SectionSplit } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'
import { DataTable } from '@/ui/data-table/data-table'
import { EmptyState } from '@/ui/empty-state'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'

type SettlementLineId =
  | 'gross_revenue'
  | 'discounts'
  | 'returns'
  | 'net_revenue'
  | 'marketplace_fees'
  | 'shipping_charges'
  | 'tax_withholdings'
  | 'estimated_payout'

type SettlementLine = {
  id: SettlementLineId
  labelKey: ShellStringKey
  kind: 'line' | 'subtotal' | 'total'
  isDeduction?: boolean
  value: (m: PlatformSettlementMetrics) => number
}

const LINES: SettlementLine[] = [
  {
    id: 'gross_revenue',
    labelKey: 'settlementWfGross',
    kind: 'line',
    value: (m) => m.gross_revenue,
  },
  {
    id: 'discounts',
    labelKey: 'settlementWfDiscounts',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.discounts,
  },
  {
    id: 'returns',
    labelKey: 'settlementWfReturns',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.returns,
  },
  {
    id: 'net_revenue',
    labelKey: 'settlementWfNetSales',
    kind: 'subtotal',
    value: (m) => m.net_revenue,
  },
  {
    id: 'marketplace_fees',
    labelKey: 'settlementWfMarketplaceFees',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.marketplace_fees,
  },
  {
    id: 'shipping_charges',
    labelKey: 'settlementWfShippingCharges',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.shipping_charges,
  },
  {
    id: 'tax_withholdings',
    labelKey: 'settlementWfTaxWithholdings',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.tax_withholdings,
  },
  {
    id: 'estimated_payout',
    labelKey: 'settlementWfEstimatedPayout',
    kind: 'total',
    value: (m) => m.estimated_payout,
  },
]

const columnHelper = createColumnHelper<SettlementLine>()

type ChannelsSettlementTableProps = {
  metrics: Record<string, PlatformSettlementMetrics>
  platforms: ChannelPlatform[]
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
}

function emphasisClass(kind: SettlementLine['kind']): string {
  return kind === 'subtotal' || kind === 'total' ? 'font-semibold' : ''
}

export function ChannelsSettlementTable({
  metrics,
  platforms,
  formatMoney,
  t,
}: ChannelsSettlementTableProps) {
  const cols = useMemo(
    () => [...platforms, { slug: 'total', label: t('channelsColTotal') }],
    [platforms, t],
  )

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'concept',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('reportsPnlColConcept')} />
        ),
        cell: ({ row }) => {
          const line = row.original
          return (
            <span className={cn('text-text-primary', emphasisClass(line.kind))}>
              {line.isDeduction
                ? `(−) ${t(line.labelKey)}`
                : line.kind !== 'line'
                  ? `= ${t(line.labelKey)}`
                  : t(line.labelKey)}
            </span>
          )
        },
        meta: {
          cellClassName: 'align-middle whitespace-nowrap pr-6',
          headerClassName: 'whitespace-nowrap',
        },
      }),
      ...cols.map((col) =>
        columnHelper.display({
          id: col.slug,
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={col.label}
              className="justify-end"
            />
          ),
          cell: ({ row }) => {
            const line = row.original
            const m = metrics[col.slug]
            const raw = line.value(m)
            const display = line.isDeduction ? -Math.abs(raw) : raw
            return (
              <span
                className={cn(
                  'w-full text-right font-numeric tabular-nums',
                  line.isDeduction && 'text-text-secondary',
                  (line.kind === 'subtotal' || line.kind === 'total') &&
                    'font-semibold text-text-primary',
                  emphasisClass(line.kind),
                )}
              >
                {formatMoney(display)}
              </span>
            )
          },
          meta: {
            headerClassName: 'text-right whitespace-nowrap',
            cellClassName: 'text-right whitespace-nowrap',
          },
        }),
      ),
    ],
    [cols, formatMoney, metrics, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: LINES,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  })

  return (
    <SectionSplit
      title={t('channelsSettlementTitle')}
      description={t('channelsSettlementSubtitle')}
    >
      <DataTable
        table={table}
        variant="plain"
        density="compact"
        tableWidth="full"
        isLoading={false}
        isFetching={false}
        hasEverLoaded={true}
        scrollClassName=""
        emptyContent={<EmptyState icon="channels" title={t('reportsNoData')} />}
        skeletonRowCount={8}
      />
    </SectionSplit>
  )
}
