import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { TaxSettingsRates } from '@/lib/types/tax-settings'
import {
  type ChannelPlatform,
  type PlatformMetrics,
} from '@/pages/channels/channels-platform-aggregate'
import {
  productHeaderColumnClassName,
  truncateProductHeaderLabel,
} from '@/pages/channels/channels-product-header-label'
import { SectionSplit } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { statementTableColumnResize } from '@/ui/data-table/statement-table-column-resize'
import { EmptyState } from '@/ui/empty-state'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

import { ProductCobroFiscalAlerts } from './product-cobro-fiscal-alerts'
import {
  estimateTaxByPlatform,
  type PlatformTaxEstimate,
} from './product-pnl-tax-estimates'

type TaxLineId =
  | 'withholding_isr'
  | 'withholding_iva'
  | 'withholding_total'
  | 'expected_net_cash'

type TaxLine = {
  id: TaxLineId
  labelKey: ShellStringKey
  kind: 'line' | 'subtotal' | 'total'
  isDeduction: boolean
  hintKey?: ShellStringKey
  value: (m: PlatformTaxEstimate) => number
}

const TAX_LINES: TaxLine[] = [
  {
    id: 'withholding_isr',
    labelKey: 'reportsTaxBlockWithholdingIsr',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.withholding_isr,
  },
  {
    id: 'withholding_iva',
    labelKey: 'reportsTaxBlockWithholdingIva',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.withholding_iva,
  },
  {
    id: 'withholding_total',
    labelKey: 'reportsTaxBlockWithholdingTotal',
    kind: 'subtotal',
    isDeduction: true,
    hintKey: 'reportsTaxBlockInformationalNote',
    value: (m) => m.withholding_total,
  },
  {
    id: 'expected_net_cash',
    labelKey: 'reportsTaxBlockExpectedNetCash',
    kind: 'total',
    isDeduction: false,
    value: (m) => m.expected_net_cash,
  },
]

const columnHelper = createColumnHelper<TaxLine>()

type ProductPnlTaxMatrixProps = {
  metrics: Record<string, PlatformMetrics>
  platforms: ChannelPlatform[]
  taxRates: TaxSettingsRates | null | undefined
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
  breakdown?: 'channel' | 'product'
  currencyCode?: string
  yearWithheld?: number | null
  yearWithheldLoading?: boolean
  showRetentionTip?: boolean
  showShopifyAlert?: boolean
  showFiscalCreditAlert?: boolean
}

function emphasisClass(kind: TaxLine['kind']): string {
  return kind === 'subtotal' || kind === 'total' ? 'font-semibold' : ''
}

export function ProductPnlTaxMatrix({
  metrics,
  platforms,
  taxRates,
  formatMoney,
  t,
  breakdown = 'channel',
  currencyCode,
  yearWithheld = null,
  yearWithheldLoading = false,
  showRetentionTip = true,
  showShopifyAlert = false,
  showFiscalCreditAlert = false,
}: ProductPnlTaxMatrixProps) {
  const byProduct = breakdown === 'product'
  const estimates = useMemo(() => {
    if (!taxRates) return null
    return estimateTaxByPlatform(metrics, platforms, taxRates)
  }, [metrics, platforms, taxRates])

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
          const label = t(line.labelKey)
          return (
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className={cn('text-text-primary', emphasisClass(line.kind))}>
                {line.isDeduction && line.kind === 'line'
                  ? `(−) ${label}`
                  : line.kind !== 'line'
                    ? `= ${label}`
                    : label}
              </span>
              {line.hintKey ? (
                <span className="text-[11px] leading-tight text-text-tertiary">
                  {t(line.hintKey)}
                </span>
              ) : null}
            </div>
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
          header: ({ column }) => {
            const isTotal = col.slug === 'total'
            const { display, full, truncated } =
              byProduct && !isTotal
                ? truncateProductHeaderLabel(col.label)
                : { display: col.label, full: col.label, truncated: false }
            const header = (
              <DataTableColumnHeader
                column={column}
                title={display}
                className={cn(
                  'justify-end',
                  byProduct && !isTotal && 'w-full overflow-hidden',
                )}
              />
            )
            if (!truncated) return header
            return (
              <Tooltip delayDuration={250}>
                <TooltipTrigger asChild>
                  <div className="inline-flex w-full max-w-full cursor-default justify-end overflow-hidden">
                    {header}
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={6}
                  className="max-w-[min(20rem,calc(100vw-2rem))] text-left normal-case"
                >
                  <span className="wrap-break-word">{full}</span>
                </TooltipContent>
              </Tooltip>
            )
          },
          cell: ({ row }) => {
            const line = row.original
            const m = estimates?.[col.slug]
            const raw = m ? line.value(m) : 0
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
            headerClassName: cn(
              'text-right whitespace-nowrap',
              byProduct && col.slug !== 'total' && productHeaderColumnClassName,
            ),
            cellClassName: cn(
              'text-right whitespace-nowrap',
              byProduct && col.slug !== 'total' && productHeaderColumnClassName,
            ),
          },
        }),
      ),
    ],
    [byProduct, cols, estimates, formatMoney, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: TAX_LINES,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
    ...statementTableColumnResize,
  })

  if (taxRates == null) {
    return (
      <SectionSplit
        title={t('reportsTaxBlockTitle')}
        description={t('reportsTaxBlockSubtitle')}
      >
        <div className="rounded-md border border-border-subtle px-4 py-3">
          <div className="space-y-2 text-sm text-text-secondary">
            <p>{t('reportsTaxBlockUnset')}</p>
            <Link
              to="/dashboard/configuration/tax-rates"
              className="font-medium text-text-primary underline-offset-2 hover:underline"
            >
              {t('reportsTaxBlockConfigLink')}
            </Link>
          </div>
        </div>
      </SectionSplit>
    )
  }

  const totalWithheld = estimates?.total?.withholding_total ?? 0

  return (
    <SectionSplit
      title={t('reportsTaxBlockTitle')}
      description={t('reportsTaxBlockSubtitle')}
    >
      <div className="flex flex-col gap-3">
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
          skeletonRowCount={4}
        />
        <ProductCobroFiscalAlerts
          t={t}
          formatMoney={formatMoney}
          currencyCode={currencyCode}
          periodWithheld={totalWithheld}
          yearWithheld={yearWithheld}
          yearWithheldLoading={yearWithheldLoading}
          showRetentionTip={showRetentionTip}
          showShopifyAlert={showShopifyAlert}
          showFiscalCreditAlert={showFiscalCreditAlert}
        />
      </div>
    </SectionSplit>
  )
}
