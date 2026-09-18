import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Info } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { TaxSettingsRates } from '@/lib/types/tax-settings'
import {
  type ChannelPlatform,
  type PlatformSettlementMetrics,
} from '@/pages/channels/channels-platform-aggregate'
import {
  productHeaderColumnClassName,
  truncateProductHeaderLabel,
} from '@/pages/channels/channels-product-header-label'
import { SectionSplit } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'
import { ContextAlertCard } from '@/ui/context-alert'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { EmptyState } from '@/ui/empty-state'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

import {
  estimateSettlementTaxByPlatform,
  type PlatformTaxEstimate,
} from './product-pnl-tax-estimates'

type TaxLineId =
  | 'withholding_isr'
  | 'isr_rate'
  | 'withholding_iva'
  | 'iva_rate'
  | 'withholding_total'
  | 'expected_net_cash'
  | 'payout_pct'

type TaxLine = {
  id: TaxLineId
  labelKey: ShellStringKey
  kind: 'line' | 'rate' | 'subtotal' | 'total'
  isDeduction: boolean
  value: (m: PlatformTaxEstimate, settlement?: PlatformSettlementMetrics) => number | null
  format: 'money' | 'pct'
}

const TAX_LINES: TaxLine[] = [
  {
    id: 'withholding_isr',
    labelKey: 'reportsTaxBlockWithholdingIsr',
    kind: 'line',
    isDeduction: true,
    format: 'money',
    value: (m) => m.withholding_isr,
  },
  {
    id: 'isr_rate',
    labelKey: 'productsDetailCobroTaxAppliedRate',
    kind: 'rate',
    isDeduction: false,
    format: 'pct',
    value: (m) => m.isr_pct,
  },
  {
    id: 'withholding_iva',
    labelKey: 'reportsTaxBlockWithholdingIva',
    kind: 'line',
    isDeduction: true,
    format: 'money',
    value: (m) => m.withholding_iva,
  },
  {
    id: 'iva_rate',
    labelKey: 'productsDetailCobroTaxAppliedRate',
    kind: 'rate',
    isDeduction: false,
    format: 'pct',
    value: (m) => m.iva_pct,
  },
  {
    id: 'withholding_total',
    labelKey: 'reportsTaxBlockWithholdingTotal',
    kind: 'subtotal',
    isDeduction: true,
    format: 'money',
    value: (m) => m.withholding_total,
  },
  {
    id: 'expected_net_cash',
    labelKey: 'settlementWfEstimatedPayout',
    kind: 'total',
    isDeduction: false,
    format: 'money',
    value: (m) => m.expected_net_cash,
  },
  {
    id: 'payout_pct',
    labelKey: 'productsDetailCobroTaxPayoutPctOfNet',
    kind: 'rate',
    isDeduction: false,
    format: 'pct',
    value: (m, settlement) => {
      const net = settlement?.net_revenue ?? 0
      if (net <= 0) return null
      return (m.expected_net_cash / net) * 100
    },
  },
]

const columnHelper = createColumnHelper<TaxLine>()

type ProductCobroTaxMatrixProps = {
  metrics: Record<string, PlatformSettlementMetrics>
  platforms: ChannelPlatform[]
  taxRates: TaxSettingsRates | null | undefined
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
  currencyCode?: string
  breakdown?: 'channel' | 'product'
}

function emphasisClass(kind: TaxLine['kind']): string {
  return kind === 'subtotal' || kind === 'total' ? 'font-semibold' : ''
}

export function ProductCobroTaxMatrix({
  metrics,
  platforms,
  taxRates,
  formatMoney,
  t,
  currencyCode,
  breakdown = 'channel',
}: ProductCobroTaxMatrixProps) {
  const byProduct = breakdown === 'product'
  const estimates = useMemo(() => {
    if (!taxRates) return null
    return estimateSettlementTaxByPlatform(
      metrics,
      platforms.map((p) => p.slug),
      taxRates,
    )
  }, [metrics, platforms, taxRates])

  const cols = useMemo(
    () => [...platforms, { slug: 'total', label: t('channelsColTotal') }],
    [platforms, t],
  )

  const hasShopify = platforms.some(
    (p) => p.slug.trim().toLowerCase() === 'shopify',
  )
  const totalWithheld = estimates?.total?.withholding_total ?? 0

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
            <span
              className={cn(
                'text-text-primary',
                line.kind === 'rate' && 'text-[11px] text-text-tertiary',
                emphasisClass(line.kind),
              )}
            >
              {line.isDeduction && line.kind === 'line'
                ? `(−) ${label}`
                : line.kind === 'subtotal' || line.kind === 'total'
                  ? `= ${label}`
                  : label}
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
            const settlement = metrics[col.slug]
            const raw = m ? line.value(m, settlement) : null
            if (raw == null) {
              return (
                <span className="w-full text-right text-text-tertiary tabular-nums">—</span>
              )
            }
            if (line.format === 'pct') {
              return (
                <span
                  className={cn(
                    'w-full text-right font-numeric tabular-nums text-text-tertiary',
                    col.slug === 'total' && line.id === 'payout_pct' && 'font-semibold text-text-primary',
                  )}
                >
                  {raw.toFixed(1)}%
                </span>
              )
            }
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
    [byProduct, cols, estimates, formatMoney, metrics, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: TAX_LINES,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
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

  const creditAmount = formatMoney(Math.abs(totalWithheld))
  const creditTitle = t('productsDetailCobroFiscalCreditAlert').replace(
    '{amount}',
    currencyCode ? `${creditAmount} ${currencyCode}` : creditAmount,
  )

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
          skeletonRowCount={7}
        />
        {hasShopify ? (
          <ContextAlertCard
            title={t('productsDetailCobroShopifyNoTaxAlert')}
            icon={Info}
            tone="info"
          />
        ) : null}
        {totalWithheld > 0 ? (
          <ContextAlertCard
            title={creditTitle}
            subtitle={t('productsDetailCobroFiscalCreditAlertHint')}
            icon={Info}
            tone="info"
            action={
              <Link
                to="/dashboard/configuration/tax-rates"
                className="text-xs font-medium text-text-primary underline-offset-2 hover:underline"
              >
                {t('productsDetailCobroFiscalCreditAlertLink')}
              </Link>
            }
          />
        ) : null}
        <ContextAlertCard
          title={t('productsDetailTaxRetentionAlert').replace('{amount}', creditAmount)}
          subtitle={t('productsDetailTaxRetentionAlertHint')}
          icon={Info}
          tone="info"
        />
      </div>
    </SectionSplit>
  )
}
