import { useMemo } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  type ChannelPlatform,
  grossMarginPct,
  type PlatformMetrics,
} from '@/pages/channels/channels-platform-aggregate'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'
import { DataTable } from '@/ui/data-table/data-table'
import { EmptyState } from '@/ui/empty-state'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'

import type { PnlRowId } from '@/pages/reports/reports-pnl-rows'

type PnlLine = {
  id: PnlRowId
  labelKey: ShellStringKey
  kind: 'line' | 'subtotal' | 'total'
  isDeduction?: boolean
  isNoData?: boolean
  value: (m: PlatformMetrics) => number
  marginPct?: (m: PlatformMetrics) => number | null
}

const LINES: PnlLine[] = [
  {
    id: 'gross_revenue',
    labelKey: 'reportsWfGrossRevenue',
    kind: 'line',
    value: (m) => m.gross_revenue,
  },
  {
    id: 'discounts',
    labelKey: 'reportsWfDiscounts',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.discounts,
  },
  {
    id: 'returns',
    labelKey: 'reportsWfReturns',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.returns,
  },
  {
    id: 'net_revenue',
    labelKey: 'reportsWfNetRevenue',
    kind: 'subtotal',
    value: (m) => m.net_revenue,
  },
  {
    id: 'cogs',
    labelKey: 'reportsWfCogs',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.cogs,
  },
  {
    id: 'gross_profit',
    labelKey: 'reportsWfGrossProfit',
    kind: 'subtotal',
    value: (m) => m.gross_profit,
    marginPct: (m) => grossMarginPct(m),
  },
  {
    id: 'platform_fees',
    labelKey: 'reportsKpiPlatformFees',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.platform_fees_total,
  },
  {
    id: 'merchant_shipping',
    labelKey: 'reportsKpiFulfillmentCost',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.merchant_shipping_cost,
  },
  {
    id: 'ads_spend',
    labelKey: 'reportsWfAdsSpend',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.ads_spend,
  },
  {
    id: 'contribution_margin',
    labelKey: 'reportsWfContributionMargin',
    kind: 'total',
    value: (m) => m.contribution_margin,
    marginPct: (m) => m.contribution_margin_pct,
  },
]

const columnHelper = createColumnHelper<PnlLine>()

type ChannelsPnlTableProps = {
  metrics: Record<string, PlatformMetrics>
  platforms: ChannelPlatform[]
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
  labelForRow: (id: PnlRowId) => string
  cmIncomplete?: boolean
}

function emphasisClass(kind: PnlLine['kind']): string {
  return kind === 'subtotal' || kind === 'total' ? 'font-semibold' : ''
}

export function ChannelsPnlTable({
  metrics,
  platforms,
  formatMoney,
  t,
  labelForRow,
  cmIncomplete = false,
}: ChannelsPnlTableProps) {
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
          const label =
            line.id === 'contribution_margin' && cmIncomplete
              ? t('channelsCmProductScopeLabel')
              : labelForRow(line.id)
          return (
            <span className={cn('text-text-primary', emphasisClass(line.kind))}>
              {line.isDeduction
                ? `(−) ${label}`
                : line.kind !== 'line'
                  ? `= ${label}`
                  : label}
            </span>
          )
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
            if (line.isNoData) {
              return (
                <span className="w-full text-right text-text-secondary">
                  {t('channelsNoData')}
                </span>
              )
            }
            const m = metrics[col.slug]
            const raw = line.value(m)
            const display = line.isDeduction ? -Math.abs(raw) : raw
            const margin =
              cmIncomplete && line.id === 'contribution_margin'
                ? null
                : line.marginPct?.(m)
            return (
              <span
                className={cn(
                  'w-full text-right font-numeric tabular-nums',
                  line.isDeduction && 'text-text-secondary',
                  (line.kind === 'subtotal' || line.kind === 'total') &&
                    'font-semibold text-text-primary',
                  cmIncomplete &&
                    line.id === 'contribution_margin' &&
                    'text-text-secondary',
                  emphasisClass(line.kind),
                )}
              >
                {formatMoney(display)}
                {margin !== null && margin !== undefined
                  ? ` (${margin.toFixed(1)}%)`
                  : ''}
              </span>
            )
          },
          meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
        }),
      ),
    ],
    [cmIncomplete, cols, formatMoney, labelForRow, metrics, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: LINES,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  })

  return (
    <SectionContainer>
      <SectionHeader
        title={t('channelsPnlTitle')}
        description={
          cmIncomplete ? t('channelsPnlSubtitleProductScope') : t('channelsPnlSubtitle')
        }
      />
      <DataTable
        table={table}
        variant="plain"
        isLoading={false}
        isFetching={false}
        hasEverLoaded={true}
        scrollClassName=""
        emptyContent={<EmptyState icon="channels" title={t('reportsNoData')} />}
        skeletonRowCount={8}
      />
    </SectionContainer>
  )
}
