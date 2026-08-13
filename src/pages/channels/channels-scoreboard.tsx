import { useMemo } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  type ChannelPlatform,
  type ScoreboardMetricId,
  type ScoreboardRow,
} from '@/pages/channels/channels-platform-aggregate'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'
import { DataTable } from '@/ui/data-table/data-table'
import { EmptyState } from '@/ui/empty-state'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'

const METRIC_LABELS: Record<ScoreboardMetricId, ShellStringKey> = {
  gross_revenue: 'reportsWfGrossRevenue',
  discounts: 'reportsWfDiscounts',
  returns: 'reportsWfReturns',
  net_revenue: 'reportsWfNetRevenue',
  order_count: 'channelsMetricOrders',
  aov: 'channelsMetricAov',
  contribution_margin: 'reportsWfContributionMargin',
  contribution_margin_pct: 'channelsMetricCmPct',
}

const columnHelper = createColumnHelper<ScoreboardRow>()

type ChannelsScoreboardProps = {
  rows: ScoreboardRow[]
  platforms: ChannelPlatform[]
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
  cmIncomplete?: boolean
}

function fmtPctDelta(n: number | null): string {
  if (n === null) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function formatMetric(
  id: ScoreboardMetricId,
  value: number,
  formatMoney: (v: number) => string,
): string {
  if (id === 'order_count') return String(Math.round(value))
  if (id === 'contribution_margin_pct') return `${value.toFixed(1)}%`
  return formatMoney(value)
}

export function ChannelsScoreboard({
  rows,
  platforms,
  formatMoney,
  t,
  cmIncomplete = false,
}: ChannelsScoreboardProps) {
  const cols = useMemo(
    () => [...platforms, { slug: 'total', label: t('channelsColTotal') }],
    [platforms, t],
  )

  const visibleRows = useMemo(
    () =>
      cmIncomplete
        ? rows.filter((row) => row.id !== 'contribution_margin_pct')
        : rows,
    [cmIncomplete, rows],
  )

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'concept',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('reportsPnlColConcept')} />
        ),
        cell: ({ row }) => {
          const id = row.original.id
          const labelKey =
            id === 'contribution_margin' && cmIncomplete
              ? ('channelsCmProductScopeLabel' as ShellStringKey)
              : METRIC_LABELS[id]
          return (
            <span
              className={cn(
                'text-text-primary',
                cmIncomplete &&
                  id === 'contribution_margin' &&
                  'text-text-secondary',
              )}
            >
              {t(labelKey)}
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
            const cell = row.original.cells[col.slug]
            return (
              <div
                className={cn(
                  'flex w-full flex-col items-end font-numeric tabular-nums text-text-primary',
                  cmIncomplete &&
                    row.original.id === 'contribution_margin' &&
                    'text-text-secondary',
                )}
              >
                <div>{formatMetric(row.original.id, cell.value, formatMoney)}</div>
                <div
                  className={cn(
                    'text-xs',
                    cell.deltaPct !== null && cell.deltaPct < 0 && 'text-red-600',
                    cell.deltaPct !== null && cell.deltaPct > 0 && 'text-emerald-700',
                    (cell.deltaPct === null || cell.deltaPct === 0) && 'text-text-secondary',
                  )}
                >
                  {fmtPctDelta(cell.deltaPct)}
                </div>
              </div>
            )
          },
          meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
        }),
      ),
    ],
    [cmIncomplete, cols, formatMoney, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: visibleRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  })

  return (
    <SectionContainer>
      <SectionHeader
        title={t('channelsScoreboardTitle')}
        description={t('channelsScoreboardSubtitle')}
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
