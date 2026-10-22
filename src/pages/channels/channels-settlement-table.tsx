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
import { cn } from '@/lib/utils'
import { DataTable } from '@/ui/data-table/data-table'
import { EmptyState } from '@/ui/empty-state'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import {
  STATEMENT_CONCEPT_COLUMN_SIZE,
  STATEMENT_VALUE_COLUMN_SIZE,
  statementTableColumnResize,
} from '@/ui/data-table/statement-table-column-resize'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'
import {
  truncateProductHeaderLabel,
} from '@/pages/channels/channels-product-header-label'

type SettlementLineId =
  | 'gross_revenue'
  | 'discounts'
  | 'returns'
  | 'net_revenue'
  | 'marketplace_fees'
  | 'shipping_charges'
  | 'tax_withholdings'
  | 'estimated_payout'
  | 'cancel_section'
  | 'cancel_merch'
  | 'cancel_annul'
  | 'cancel_fees'
  | 'cancel_shipping'
  | 'cancel_tax'
  | 'cancel_total'

type SettlementLine = {
  id: SettlementLineId
  labelKey: ShellStringKey
  kind: 'line' | 'subtotal' | 'total' | 'section'
  isDeduction?: boolean
  value: (m: PlatformSettlementMetrics) => number
}

const ALL_SETTLEMENT_LINES: SettlementLine[] = [
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

const CANCEL_COST_LINES: SettlementLine[] = [
  {
    id: 'cancel_section',
    labelKey: 'settlementCancelCostSection',
    kind: 'section',
    value: () => 0,
  },
  {
    id: 'cancel_merch',
    labelKey: 'settlementCancelCostMerchandise',
    kind: 'line',
    value: (m) => m.platform_cancel_costs.merchandise_gross,
  },
  {
    id: 'cancel_annul',
    labelKey: 'settlementCancelCostAnnulled',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.platform_cancel_costs.merchandise_annulled,
  },
  {
    id: 'cancel_fees',
    labelKey: 'settlementCancelCostFees',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.platform_cancel_costs.marketplace_fees,
  },
  {
    id: 'cancel_shipping',
    labelKey: 'settlementCancelCostShipping',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.platform_cancel_costs.shipping_charges,
  },
  {
    id: 'cancel_tax',
    labelKey: 'settlementCancelCostTax',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.platform_cancel_costs.tax_withholdings,
  },
  {
    id: 'cancel_total',
    labelKey: 'settlementCancelCostTotal',
    kind: 'total',
    value: (m) => m.platform_cancel_costs.total,
  },
]

const columnHelper = createColumnHelper<SettlementLine>()

function wholeAmount(value: number, deduction: boolean, currency?: string): string {
  if (Math.abs(value) < 0.5) return '—'
  const rounded = Math.round(Math.abs(value))
  const text = rounded.toLocaleString()
  const withCurrency = currency ? `${text} ${currency}` : text
  return deduction ? `−${withCurrency}` : withCurrency
}

type ChannelsSettlementTableProps = {
  metrics: Record<string, PlatformSettlementMetrics>
  platforms: ChannelPlatform[]
  /** Currency formatter. Channels omits it and uses whole amounts, like the P&L. */
  formatMoney?: (value: number) => string
  t: (key: ShellStringKey) => string
  /** When false, omit Retenido SAT / tax withholdings row (Vista B). */
  includeTaxWithholdings?: boolean
  /** Truncate product column headers (group detail by product). */
  truncateLongHeaders?: boolean
  amountBasis?: 'money' | 'pct'
  /** ISO code of the amounts, shown after each money figure. */
  currency?: string
}

function emphasisClass(kind: SettlementLine['kind']): string {
  return kind === 'subtotal' || kind === 'total' ? 'font-semibold' : ''
}

export function ChannelsSettlementTable({
  metrics,
  platforms,
  formatMoney,
  t,
  includeTaxWithholdings = true,
  truncateLongHeaders = false,
  amountBasis = 'money',
  currency,
}: ChannelsSettlementTableProps) {
  const lines = useMemo(() => {
    const base = includeTaxWithholdings
      ? ALL_SETTLEMENT_LINES
      : ALL_SETTLEMENT_LINES.filter((line) => line.id !== 'tax_withholdings')
    const hasCancel = Object.values(metrics).some((m) => {
      const c = m.platform_cancel_costs
      return c.total !== 0 || c.shipping_charges !== 0 || c.merchandise_gross !== 0
    })
    return hasCancel ? [...base, ...CANCEL_COST_LINES] : base
  }, [includeTaxWithholdings, metrics])
  const cols = useMemo(
    () => [...platforms, { slug: 'total', label: t('channelsColTotal') }],
    [platforms, t],
  )

  const columns = useMemo(
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
          const emphasize = line.id === 'estimated_payout'
          if (line.kind === 'section') {
            return (
              <span className="pt-2 text-sm font-semibold text-text-primary">
                {t(line.labelKey)}
              </span>
            )
          }
          const prefix = line.isDeduction ? '(−) ' : line.kind !== 'line' ? '= ' : ''
          return (
            <span
              data-row-emphasis={emphasize ? '' : undefined}
              className={cn('py-1 text-sm text-text-primary', emphasisClass(line.kind))}
            >
              {prefix}
              {t(line.labelKey)}
            </span>
          )
        },
        meta: {
          headerClassName: 'overflow-hidden',
          cellClassName: 'h-auto py-1.5 align-middle [&>div]:h-full [&>div]:items-center',
        },
      }),
      ...cols.map((col) =>
        columnHelper.display({
          id: col.slug,
          ...STATEMENT_VALUE_COLUMN_SIZE,
          header: () => {
            const isTotal = col.slug === 'total'
            const { display, full, truncated } =
              truncateLongHeaders && !isTotal
                ? truncateProductHeaderLabel(col.label)
                : { display: col.label, full: col.label, truncated: false }
            const header = (
              <span className="flex w-full flex-col items-end gap-0.5 py-1">
                <span className="max-w-full truncate font-numeric text-xs font-medium uppercase text-[#767676]">
                  {display}
                </span>
              </span>
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
            if (line.kind === 'section') {
              return <span className="w-full text-right text-text-secondary">—</span>
            }
            const m = metrics[col.slug] ?? {
              platform: col.slug,
              gross_revenue: 0,
              discounts: 0,
              returns: 0,
              net_revenue: 0,
              marketplace_fees: 0,
              shipping_charges: 0,
              tax_withholdings: 0,
              estimated_payout: 0,
              completeness: 'unavailable',
              platform_cancel_costs: {
                merchandise_gross: 0,
                merchandise_annulled: 0,
                marketplace_fees: 0,
                shipping_charges: 0,
                tax_withholdings: 0,
                total: 0,
              },
            }
            const raw = line.value(m)
            const emphasize = line.id === 'estimated_payout'
            let formatted = '—'
            if (Math.abs(raw) >= 0.5) {
              if (amountBasis === 'pct') {
                const net = Math.abs(m.net_revenue)
                formatted =
                  net < 0.5
                    ? '—'
                    : line.id === 'net_revenue'
                      ? '100%'
                      : `${((Math.abs(raw) / net) * 100).toFixed(1)}%`
              } else if (formatMoney) {
                formatted = formatMoney(line.isDeduction ? -Math.abs(raw) : raw)
              } else {
                formatted = wholeAmount(raw, Boolean(line.isDeduction), currency)
              }
            }
            return (
              <span
                data-row-emphasis={emphasize ? '' : undefined}
                className={cn(
                  'w-full py-1 text-right font-numeric text-sm tabular-nums text-text-primary',
                  emphasisClass(line.kind),
                  formatted === '—' && 'text-text-tertiary',
                )}
              >
                {formatted}
              </span>
            )
          },
          meta: {
            headerClassName: 'text-right overflow-hidden',
            cellClassName:
              'h-auto py-1.5 text-right tabular-nums align-middle [&>div]:h-full [&>div]:items-center',
          },
        }),
      ),
    ],
    [amountBasis, cols, currency, formatMoney, metrics, t, truncateLongHeaders],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: lines,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
    ...statementTableColumnResize,
  })

  const description =
    amountBasis === 'pct' ? t('channelsPctOfNet') : t('channelsSettlementSubtitle')

  return (
    <section className="flex flex-col gap-3 [&_td:has([data-row-emphasis])]:bg-[#f6f3d4]">
      <SettingsSectionHeader title={t('channelsSettlementTitle')} description={description} />
      {Object.values(metrics).some(
        (m) =>
          m.platform_cancel_costs.total !== 0 ||
          m.platform_cancel_costs.shipping_charges !== 0,
      ) ? (
        <p className="mb-3 text-xs text-text-secondary">{t('settlementCancelCostHint')}</p>
      ) : null}
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
    </section>
  )
}
