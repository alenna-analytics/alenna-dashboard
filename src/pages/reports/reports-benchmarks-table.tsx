import { useMemo } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { BenchmarkBand, BenchmarkMetricId, BenchmarkRow } from '@/pages/reports/reports-benchmarks'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'
import { DataTable } from '@/ui/data-table/data-table'
import { EmptyState } from '@/ui/empty-state'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'

const METRIC_LABELS: Record<BenchmarkMetricId, ShellStringKey> = {
  gross_margin_pct: 'reportsKpiMargenBrutoPct',
  contribution_margin_pct: 'reportsKpiContributionMarginPctLabel',
  ads_to_net_pct: 'reportsBenchAdsToNet',
  ebitda_margin_pct: 'reportsKpiEbitdaMarginPct',
  tacos: 'reportsBenchTacos',
  roas: 'reportsBenchRoas',
  ltv_cac: 'reportsBenchLtvCac',
}

const BAND_LABELS: Record<BenchmarkBand, ShellStringKey> = {
  green: 'reportsBenchStatusGreen',
  yellow: 'reportsBenchStatusYellow',
  red: 'reportsBenchStatusRed',
  no_data: 'reportsBenchStatusNoData',
}

function bandClass(band: BenchmarkBand): string {
  switch (band) {
    case 'green':
      return 'bg-emerald-50 text-emerald-800'
    case 'yellow':
      return 'bg-amber-50 text-amber-900'
    case 'red':
      return 'bg-red-50 text-red-800'
    default:
      return 'bg-muted/30 text-text-secondary'
  }
}

const columnHelper = createColumnHelper<BenchmarkRow>()

type ReportsBenchmarksTableProps = {
  rows: BenchmarkRow[]
  t: (key: ShellStringKey) => string
}

export function ReportsBenchmarksTable({ rows, t }: ReportsBenchmarksTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'metric',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('reportsBenchColMetric')} />
        ),
        cell: ({ row }) => (
          <span className="text-text-primary">{t(METRIC_LABELS[row.original.id])}</span>
        ),
      }),
      columnHelper.display({
        id: 'value',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsBenchColValue')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          const r = row.original
          return (
            <span className="w-full text-right font-numeric tabular-nums">
              {r.band === 'no_data' || r.value === null
                ? t('reportsBenchStatusNoData')
                : `${r.value.toFixed(1)}%`}
            </span>
          )
        },
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      }),
      columnHelper.display({
        id: 'green',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsBenchColGreen')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => (
          <span className="w-full text-right text-text-secondary">{row.original.greenLabel}</span>
        ),
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      }),
      columnHelper.display({
        id: 'yellow',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsBenchColYellow')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => (
          <span className="w-full text-right text-text-secondary">{row.original.yellowLabel}</span>
        ),
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      }),
      columnHelper.display({
        id: 'red',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsBenchColRed')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => (
          <span className="w-full text-right text-text-secondary">{row.original.redLabel}</span>
        ),
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      }),
      columnHelper.display({
        id: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsBenchColStatus')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => (
          <span className="flex w-full justify-end">
            <span
              className={cn(
                'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                bandClass(row.original.band),
              )}
            >
              {t(BAND_LABELS[row.original.band])}
            </span>
          </span>
        ),
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      }),
    ],
    [t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  })

  return (
    <SectionContainer className="overflow-hidden">
      <SectionHeader
        title={t('reportsBenchmarksTitle')}
        description={t('reportsBenchmarksSubtitle')}
      />
      <DataTable
        table={table}
        variant="plain"
        isLoading={false}
        isFetching={false}
        hasEverLoaded={true}
        scrollClassName=""
        emptyContent={<EmptyState icon="reports" title={t('reportsNoData')} />}
        skeletonRowCount={8}
      />
    </SectionContainer>
  )
}
