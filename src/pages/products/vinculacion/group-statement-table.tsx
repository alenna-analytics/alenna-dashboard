import { useMemo } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'
import { SettingsSectionHeader } from '@/pages/configuration/settings-layout'
import { DataTable } from '@/ui/data-table/data-table'
import { EmptyState } from '@/ui/empty-state'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import {
  STATEMENT_CONCEPT_COLUMN_SIZE,
  STATEMENT_VALUE_COLUMN_SIZE,
  statementTableColumnResize,
} from '@/ui/data-table/statement-table-column-resize'

import type { GroupStatementColumn } from './group-statement'

export type GroupStatementRow = {
  id: string
  label: string
  hint?: string
  kind: 'line' | 'subtotal' | 'total'
  format: 'money' | 'price' | 'pct' | 'count' | 'text'
  deduction?: boolean
  emphasize?: boolean
  values: Record<string, number | null>
  textValues?: Record<string, string | null>
}

type ShellT = (key: ShellStringKey) => string

const columnHelper = createColumnHelper<GroupStatementRow>()

function wholeAmount(value: number, lang: string, deduction: boolean): string {
  if (Math.abs(value) < 0.5) return '—'
  const rounded = Math.round(Math.abs(value))
  const text = rounded.toLocaleString(lang === 'en' ? 'en-US' : 'es-MX')
  return deduction ? `−${text}` : text
}

type GroupStatementTableProps = {
  title: string
  description?: string
  columns: GroupStatementColumn[]
  total: GroupStatementColumn
  details: Record<string, string>
  rows: GroupStatementRow[]
  lang: string
  t: ShellT
  formatPrice: (value: number) => string
}

export function GroupStatementTable({
  title,
  description,
  columns,
  total,
  details,
  rows,
  lang,
  t,
  formatPrice,
}: GroupStatementTableProps) {
  const visible = useMemo(
    () => [...columns, { ...total, id: 'total', label: t('channelsColTotal') }],
    [columns, t, total],
  )

  const tableColumns = useMemo(
    () => [
      columnHelper.display({
        id: 'concept',
        ...STATEMENT_CONCEPT_COLUMN_SIZE,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('reportsPnlColConcept')}
            className="text-[#767676]"
          />
        ),
        cell: ({ row }) => {
          const line = row.original
          const prefix =
            line.deduction && line.kind === 'line'
              ? '(−) '
              : line.kind === 'subtotal' || line.kind === 'total'
                ? '= '
                : ''
          return (
            <span
              data-row-emphasis={line.emphasize ? '' : undefined}
              className="flex min-w-0 flex-col gap-0.5 py-1"
            >
              <span
                className={cn(
                  'text-sm text-text-primary',
                  (line.kind === 'subtotal' || line.kind === 'total') && 'font-semibold',
                )}
              >
                {prefix}
                {line.label}
              </span>
              {line.hint ? (
                <span className="text-xs leading-4 text-[#767676]">{line.hint}</span>
              ) : null}
            </span>
          )
        },
        meta: {
          headerClassName: 'overflow-hidden',
          cellClassName: 'h-auto py-1.5 align-middle [&>div]:items-start',
        },
      }),
      ...visible.map((column) =>
        columnHelper.display({
          id: column.id,
          ...STATEMENT_VALUE_COLUMN_SIZE,
          header: () => (
            <span className="flex w-full flex-col items-end gap-0.5 py-1">
              <span className="font-numeric text-xs font-medium uppercase text-[#767676]">
                {column.label}
              </span>
              <span className="text-[11px] font-normal normal-case text-[#767676]">
                {details[column.id] ?? ''}
              </span>
            </span>
          ),
          cell: ({ row }) => {
            const line = row.original
            const text = line.textValues?.[column.id]
            let formatted = '—'
            if (text != null) {
              formatted = text
            } else {
              const raw = line.values[column.id]
              if (raw == null || !Number.isFinite(raw)) {
                formatted = '—'
              } else if (line.format === 'pct') {
                formatted = `${raw.toFixed(1)}%`
              } else if (line.format === 'count') {
                formatted = Math.round(raw).toLocaleString(lang === 'en' ? 'en-US' : 'es-MX')
              } else if (line.format === 'price') {
                formatted = Math.abs(raw) < 0.005 ? '—' : formatPrice(raw)
              } else if (line.format === 'text') {
                formatted = '—'
              } else {
                formatted = wholeAmount(raw, lang, Boolean(line.deduction))
              }
            }
            return (
              <span
                data-row-emphasis={line.emphasize ? '' : undefined}
                className={cn(
                  'w-full py-1 text-right font-numeric text-sm tabular-nums text-text-primary',
                  (line.kind === 'subtotal' || line.kind === 'total') && 'font-semibold',
                  formatted === '—' && 'text-text-tertiary',
                )}
              >
                {formatted}
              </span>
            )
          },
          meta: {
            headerClassName: 'text-right overflow-hidden',
            cellClassName: 'h-auto py-1.5 text-right tabular-nums [&>div]:items-center',
          },
        }),
      ),
    ],
    [details, formatPrice, lang, t, visible],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
    ...statementTableColumnResize,
  })

  return (
    <section className="flex flex-col gap-3 [&_td:has([data-row-emphasis])]:bg-[#f6f3d4]">
      <SettingsSectionHeader title={title} description={description} />
      <DataTable
        table={table}
        variant="plain"
        density="compact"
        tableWidth="full"
        isLoading={false}
        isFetching={false}
        hasEverLoaded
        scrollClassName=""
        skeletonRowCount={6}
        emptyContent={<EmptyState size="sm" icon="channels" title={t('reportsNoData')} />}
      />
    </section>
  )
}
