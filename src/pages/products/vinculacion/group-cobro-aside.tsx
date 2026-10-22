import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { SettingsSectionHeader } from '@/pages/configuration/settings-layout'
import { productPlatformLabel } from '@/pages/products/product-platform-label'
import { DataTable } from '@/ui/data-table/data-table'
import { EmptyState } from '@/ui/empty-state'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { Skeleton } from '@/ui/skeleton'

import type { GroupStatementColumn } from './group-statement'

type ShellT = (key: ShellStringKey) => string

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value == null ? match : String(value)
  })
}

function isMercadoLibre(platform: string): boolean {
  const key = platform.trim().toLowerCase().replace(/_/g, '')
  return key === 'mercadolibre' || key === 'meli'
}

function depositCopy(platform: string, t: ShellT): string {
  const key = platform.trim().toLowerCase().replace(/_/g, '')
  if (key === 'amazon') return t('productsGroupTimingAmazon')
  if (key === 'mercadolibre' || key === 'meli') return t('productsDetailCobroTimingMeli')
  if (key === 'shopify') return t('productsDetailCobroTimingShopify')
  return t('productsDetailCobroTimingDefault')
}

type TimingRow = { id: string; platform: string; how: string }

const columnHelper = createColumnHelper<TimingRow>()

const TEXT_START = {
  headerClassName: '[&>div]:justify-start',
  cellClassName: '[&>div]:justify-start',
} as const

export function GroupCobroAside({
  columns,
  total,
  transferredIvaPct,
  isrPct,
  ivaPct,
  formatWhole,
  formatMoney,
  currencyCode,
  yearWithheld,
  yearWithheldLoading,
  t,
}: {
  columns: GroupStatementColumn[]
  total: GroupStatementColumn
  transferredIvaPct: number
  isrPct: number | null
  ivaPct: number | null
  formatWhole: (value: number) => string
  formatMoney: (value: number) => string
  currencyCode: string
  yearWithheld: number | null
  yearWithheldLoading: boolean
  t: ShellT
}) {
  const [yearOpen, setYearOpen] = useState(false)
  const ml = columns.find((column) => isMercadoLibre(column.platform) && column.taxReal > 0)
  const mlBase = ml ? ml.net / (1 + transferredIvaPct / 100) : 0
  const mlRate = ml && mlBase > 0 ? (ml.taxReal / mlBase) * 100 : null
  const formula =
    ml && mlRate != null
      ? fill(t('productsGroupCobroFormulaBody'), {
          isr: isrPct ?? 0,
          iva: ivaPct ?? 0,
          withheld: formatWhole(ml.taxReal),
          base: formatWhole(mlBase),
          rate: mlRate.toFixed(1),
        })
      : fill(t('productsGroupCobroFormulaBodyShort'), {
          isr: isrPct ?? 0,
          iva: ivaPct ?? 0,
        })

  const rows = useMemo(
    (): TimingRow[] =>
      columns.map((column) => ({
        id: column.id,
        platform: column.platform,
        how: depositCopy(column.platform, t),
      })),
    [columns, t],
  )
  const tableColumns = useMemo(
    () => [
      columnHelper.display({
        id: 'channel',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('homeFilterChannels')}
            className="text-[#767676]"
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-text-primary">
            {productPlatformLabel(row.original.platform, t)}
          </span>
        ),
        meta: TEXT_START,
      }),
      columnHelper.accessor('how', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsGroupTimingHow')}
            className="text-[#767676]"
          />
        ),
        cell: ({ getValue }) => (
          <span className="text-sm text-text-secondary">{getValue()}</span>
        ),
        meta: TEXT_START,
      }),
      columnHelper.display({
        id: 'release',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsGroupTimingRelease')}
            className="justify-end text-[#767676]"
          />
        ),
        cell: () => (
          <span className="text-sm text-text-tertiary">{t('productsGroupTimingPending')}</span>
        ),
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      }),
      columnHelper.display({
        id: 'next',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsGroupTimingNext')}
            className="justify-end text-[#767676]"
          />
        ),
        cell: () => (
          <span className="text-sm text-text-tertiary">{t('productsGroupTimingPending')}</span>
        ),
        meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      }),
    ],
    [t],
  )
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border-subtle bg-muted/40 px-4 py-3">
          <p className="text-sm font-medium text-text-primary">{t('productsGroupCobroCreditTitle')}</p>
          <p className="mt-2 font-numeric text-2xl tabular-nums text-text-primary">
            {formatMoney(total.tax)}{' '}
            <span className="text-sm font-medium text-text-tertiary">{currencyCode}</span>
          </p>
          <p className="mt-2 text-sm text-text-secondary">{t('productsGroupCobroCreditBody')}</p>
          <button
            type="button"
            className="mt-3 cursor-pointer text-sm font-medium text-text-primary underline underline-offset-2 transition-opacity hover:opacity-70"
            onClick={() => setYearOpen(true)}
          >
            {t('productsDetailCobroFiscalCreditAlertLink')}
          </button>
        </div>
        <div className="rounded-lg border border-border-subtle bg-muted/40 px-4 py-3">
          <p className="text-sm font-medium text-text-primary">{t('productsGroupCobroFormulaTitle')}</p>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {formula}{' '}
            <Link
              to="/dashboard/configuration/tax-rates"
              className="font-medium text-text-primary underline underline-offset-2"
            >
              {t('productsGroupTaxSettingsLink')}
            </Link>
            .
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <SettingsSectionHeader
          title={t('productsGroupTimingTitle')}
          description={t('productsGroupTimingSubtitle')}
        />
        <DataTable
          table={table}
          variant="plain"
          density="compact"
          tableWidth="full"
          isLoading={false}
          isFetching={false}
          hasEverLoaded
          scrollClassName=""
          skeletonRowCount={2}
          emptyContent={<EmptyState size="sm" icon="channels" title={t('reportsNoData')} />}
        />
      </section>

      <Dialog open={yearOpen} onOpenChange={setYearOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('productsDetailCobroFiscalYearModalTitle')}</DialogTitle>
            <DialogDescription>
              {t('productsDetailCobroFiscalYearModalDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-1">
            <div className="rounded-md border border-border-subtle px-4 py-3">
              <p className="text-xs text-text-tertiary">
                {t('productsDetailCobroFiscalYearModalPeriodLabel')}
              </p>
              <p className="mt-1 font-numeric text-lg tabular-nums text-text-primary">
                {formatMoney(total.tax)} {currencyCode}
              </p>
            </div>
            <div className="rounded-md border border-border-subtle px-4 py-3">
              <p className="text-xs text-text-tertiary">
                {t('productsDetailCobroFiscalYearModalYtdLabel')}
              </p>
              {yearWithheldLoading ? (
                <Skeleton className="mt-2 h-7 w-36" aria-hidden />
              ) : (
                <p className="mt-1 font-numeric text-lg tabular-nums text-text-primary">
                  {yearWithheld == null
                    ? t('productsDetailKpiNoData')
                    : `${formatMoney(yearWithheld)} ${currencyCode}`}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
