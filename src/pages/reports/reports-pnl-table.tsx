import { useMemo } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { PnlRow, PnlRowId } from '@/pages/reports/reports-pnl-rows'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'

const columnHelper = createColumnHelper<PnlRow>()

type ReportsPnlTableProps = {
  rows: PnlRow[]
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
  labelForRow: (id: PnlRowId) => string
}

function fmtPct(n: number | null): string {
  if (n === null) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function fmtDeltaMoney(n: number | null, formatMoney: (v: number) => string): string {
  if (n === null) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${formatMoney(n)}`
}

function emphasisClass(kind: PnlRow['kind']): string {
  return kind === 'subtotal' || kind === 'total' ? 'font-semibold' : ''
}

export function ReportsPnlTable({
  rows,
  formatMoney,
  t,
  labelForRow,
}: ReportsPnlTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'concept',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('reportsPnlColConcept')} />
        ),
        cell: ({ row }) => {
          const r = row.original
          const label = labelForRow(r.id)
          const margin = r.marginPct !== null ? ` (${r.marginPct.toFixed(1)}%)` : ''
          return (
            <span className={cn('text-text-primary', emphasisClass(r.kind))}>
              {r.isDeduction
                ? `(−) ${label}`
                : r.kind !== 'line'
                  ? `= ${label}${margin}`
                  : label}
            </span>
          )
        },
        meta: {
          cellClassName: 'align-middle',
        },
      }),
      columnHelper.display({
        id: 'current',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsPnlColCurrent')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          const r = row.original
          const displayCurrent = r.isDeduction ? -Math.abs(r.current) : r.current
          return (
            <span
              className={cn(
                'w-full text-right font-numeric tabular-nums',
                r.isDeduction && 'text-text-secondary',
                emphasisClass(r.kind),
                r.id === 'ebitda' && r.current < 0 && 'text-red-600',
              )}
            >
              {formatMoney(displayCurrent)}
            </span>
          )
        },
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      }),
      columnHelper.display({
        id: 'previous',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsPnlColPrevious')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          const r = row.original
          const displayPrevious =
            r.previous === null ? null : r.isDeduction ? -Math.abs(r.previous) : r.previous
          return (
            <span className="w-full text-right font-numeric tabular-nums text-text-secondary">
              {displayPrevious === null ? '—' : formatMoney(displayPrevious)}
            </span>
          )
        },
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      }),
      columnHelper.display({
        id: 'deltaAbs',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsPnlColDeltaAbs')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          const r = row.original
          return (
            <span
              className={cn(
                'w-full text-right font-numeric tabular-nums',
                r.deltaAbs !== null && r.deltaAbs < 0 && 'text-red-600',
                r.deltaAbs !== null && r.deltaAbs > 0 && 'text-emerald-700',
              )}
            >
              {fmtDeltaMoney(r.deltaAbs, formatMoney)}
            </span>
          )
        },
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      }),
      columnHelper.display({
        id: 'deltaPct',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsPnlColDeltaPct')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          const r = row.original
          return (
            <span
              className={cn(
                'w-full text-right font-numeric tabular-nums',
                r.deltaPct !== null && r.deltaPct < 0 && 'text-red-600',
                r.deltaPct !== null && r.deltaPct > 0 && 'text-emerald-700',
              )}
            >
              {fmtPct(r.deltaPct)}
            </span>
          )
        },
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      }),
      columnHelper.display({
        id: 'yoyPct',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsPnlColYoyPct')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          const r = row.original
          return (
            <span
              className={cn(
                'w-full text-right font-numeric tabular-nums',
                r.yoyDeltaPct !== null && r.yoyDeltaPct < 0 && 'text-red-600',
                r.yoyDeltaPct !== null && r.yoyDeltaPct > 0 && 'text-emerald-700',
              )}
            >
              {fmtPct(r.yoyDeltaPct)}
            </span>
          )
        },
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      }),
    ],
    [formatMoney, t, labelForRow],
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
        title={t('reportsPnlTableTitle')}
        description={t('reportsPnlTableSubtitle')}
      />
      <DataTable
        table={table}
        variant="plain"
        isLoading={false}
        isFetching={false}
        hasEverLoaded={true}
        scrollClassName=""
        emptyContent={
          <p className="px-4 py-8 text-center text-sm text-text-secondary">
            {t('reportsNoData')}
          </p>
        }
        skeletonRowCount={8}
      />
    </SectionContainer>
  )
}
