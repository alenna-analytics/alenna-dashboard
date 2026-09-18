import { useMemo } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  attributedRoas,
  type AdsNetworkId,
  type PlatformAdsRollup,
  tacosPct,
} from '@/pages/channels/channels-ads-by-platform'
import {
  type ChannelPlatform,
  channelMarginAmount,
  channelMarginPct,
  cmPerUnit,
  grossMarginPct,
  type PlatformMetrics,
} from '@/pages/channels/channels-platform-aggregate'
import {
  truncateProductHeaderLabel,
} from '@/pages/channels/channels-product-header-label'
import type { PnlRowId } from '@/pages/reports/reports-pnl-rows'
import { SectionSplit } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { EmptyState } from '@/ui/empty-state'
import {
  STATEMENT_CONCEPT_COLUMN_SIZE,
  STATEMENT_VALUE_COLUMN_SIZE,
  statementTableColumnResize,
} from '@/ui/data-table/statement-table-column-resize'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

type ChannelsPnlLineId =
  | PnlRowId
  | 'order_count'
  | 'aov'
  | 'units_sold'
  | 'cm_per_unit'
  | 'fee_shopify'
  | 'fee_amazon'
  | 'fee_ml'
  | 'ads_google'
  | 'ads_meta'
  | 'ads_amazon'
  | 'ads_ml'
  | 'ads_other'
  | 'tacos'
  | 'roas'

type PnlLine = {
  id: ChannelsPnlLineId
  labelKey: ShellStringKey
  kind: 'line' | 'subtotal' | 'total' | 'subrow'
  isDeduction?: boolean
  isNoData?: boolean
  indent?: boolean
  format: 'money' | 'count' | 'pct' | 'ratio'
  value: (m: PlatformMetrics, colSlug: string) => number | null
  marginPct?: (m: PlatformMetrics) => number | null
}

const FEE_PLATFORM_SLUG: Record<string, string> = {
  fee_shopify: 'shopify',
  fee_amazon: 'amazon',
  fee_ml: 'mercadolibre',
}

const ADS_NETWORK_FOR_LINE: Partial<Record<ChannelsPnlLineId, AdsNetworkId>> = {
  ads_google: 'google_ads',
  ads_meta: 'meta_ads',
  ads_amazon: 'amazon_ads',
  ads_ml: 'mercadolibre_ads',
}

const CORE_BEFORE_FEES: PnlLine[] = [
  {
    id: 'gross_revenue',
    labelKey: 'reportsWfGrossRevenue',
    kind: 'line',
    format: 'money',
    value: (m) => m.gross_revenue,
  },
  {
    id: 'discounts',
    labelKey: 'reportsWfDiscounts',
    kind: 'line',
    isDeduction: true,
    format: 'money',
    value: (m) => m.discounts,
  },
  {
    id: 'returns',
    labelKey: 'reportsWfReturns',
    kind: 'line',
    isDeduction: true,
    format: 'money',
    value: (m) => m.returns,
  },
  {
    id: 'net_revenue',
    labelKey: 'reportsWfNetRevenue',
    kind: 'subtotal',
    format: 'money',
    value: (m) => m.net_revenue,
  },
  {
    id: 'cogs',
    labelKey: 'reportsWfCogs',
    kind: 'line',
    isDeduction: true,
    format: 'money',
    value: (m) => m.cogs,
  },
  {
    id: 'gross_profit',
    labelKey: 'reportsWfGrossProfit',
    kind: 'subtotal',
    format: 'money',
    value: (m) => m.gross_profit,
    marginPct: (m) => grossMarginPct(m),
  },
  {
    id: 'platform_fees',
    labelKey: 'reportsKpiPlatformFees',
    kind: 'line',
    isDeduction: true,
    format: 'money',
    value: (m) => m.platform_fees_total,
  },
]

const FEE_SUBROW_DEFS: Array<{ id: ChannelsPnlLineId; labelKey: ShellStringKey }> = [
  { id: 'fee_shopify', labelKey: 'channelsFeeShopifyPayments' },
  { id: 'fee_amazon', labelKey: 'channelsFeeAmazonReferralFba' },
  { id: 'fee_ml', labelKey: 'channelsFeeMlCargo' },
]

const AFTER_FEES: PnlLine[] = [
  {
    id: 'merchant_shipping',
    labelKey: 'reportsKpiFulfillmentCost',
    kind: 'line',
    isDeduction: true,
    format: 'money',
    value: (m) => m.merchant_shipping_cost,
  },
  {
    id: 'channel_margin',
    labelKey: 'reportsChannelMargin',
    kind: 'subtotal',
    format: 'money',
    value: (m) => channelMarginAmount(m),
    marginPct: (m) => channelMarginPct(m),
  },
  {
    id: 'ads_spend',
    labelKey: 'reportsWfAdsSpend',
    kind: 'line',
    isDeduction: true,
    format: 'money',
    value: (m) => m.ads_spend,
  },
]

const ADS_SUBROW_DEFS: Array<{
  id: ChannelsPnlLineId
  labelKey: ShellStringKey
  alwaysNull?: boolean
}> = [
  { id: 'ads_google', labelKey: 'channelsAdsGoogle' },
  { id: 'ads_meta', labelKey: 'channelsAdsMeta', alwaysNull: true },
  { id: 'ads_amazon', labelKey: 'channelsAdsAmazon' },
  { id: 'ads_ml', labelKey: 'channelsAdsMl' },
  { id: 'ads_other', labelKey: 'channelsAdsOtherUnlinked' },
]

const AFTER_ADS: PnlLine[] = [
  {
    id: 'contribution_margin',
    labelKey: 'reportsWfContributionMargin',
    kind: 'total',
    format: 'money',
    value: (m) => m.contribution_margin,
    marginPct: (m) => m.contribution_margin_pct,
  },
]

const FOOTER_ORDERS: PnlLine[] = [
  {
    id: 'order_count',
    labelKey: 'channelsMetricOrders',
    kind: 'line',
    format: 'count',
    value: (m) => m.order_count,
  },
  {
    id: 'aov',
    labelKey: 'channelsMetricAov',
    kind: 'line',
    format: 'money',
    value: (m) => m.aov,
  },
]

const FOOTER_UNITS: PnlLine[] = [
  {
    id: 'units_sold',
    labelKey: 'reportsUnitsSoldLabel',
    kind: 'line',
    format: 'count',
    value: (m) => m.units_sold,
  },
  {
    id: 'cm_per_unit',
    labelKey: 'productsDetailCmPerUnit',
    kind: 'line',
    format: 'money',
    value: (m) => cmPerUnit(m),
  },
]

const columnHelper = createColumnHelper<PnlLine>()

export type ChannelsPnlDetailLevel = 'full' | 'core'

type ChannelsPnlTableProps = {
  metrics: Record<string, PlatformMetrics>
  platforms: ChannelPlatform[]
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
  labelForRow: (id: PnlRowId) => string
  cmIncomplete?: boolean
  breakdown?: 'channel' | 'product'
  footerMode?: 'orders' | 'units'
  detailLevel?: ChannelsPnlDetailLevel
  adsByPlatform?: Record<string, PlatformAdsRollup>
  tenantAdsSpend?: number
}

function emphasisClass(kind: PnlLine['kind']): string {
  return kind === 'subtotal' || kind === 'total' ? 'font-semibold' : ''
}

function emptyMetricsStub(platform: string): PlatformMetrics {
  return {
    platform,
    gross_revenue: 0,
    discounts: 0,
    returns: 0,
    net_revenue: 0,
    order_count: 0,
    aov: 0,
    cogs: 0,
    gross_profit: 0,
    platform_fees_total: 0,
    merchant_shipping_cost: 0,
    ads_spend: 0,
    contribution_margin: 0,
    contribution_margin_pct: 0,
    units_sold: 0,
  }
}

export function ChannelsPnlTable({
  metrics,
  platforms,
  formatMoney,
  t,
  labelForRow,
  cmIncomplete = false,
  breakdown = 'channel',
  footerMode = 'orders',
  detailLevel = 'core',
  adsByPlatform,
  tenantAdsSpend = 0,
}: ChannelsPnlTableProps) {
  const byProduct = breakdown === 'product'
  const full = detailLevel === 'full'

  const lines = useMemo(() => {
    const footer = footerMode === 'units' ? FOOTER_UNITS : FOOTER_ORDERS
    if (!full) {
      return [...CORE_BEFORE_FEES, ...AFTER_FEES, ...AFTER_ADS, ...footer]
    }

    const presentSlugs = new Set(platforms.map((p) => p.slug))
    const feeRows: PnlLine[] = FEE_SUBROW_DEFS.filter((def) => {
      const slug = FEE_PLATFORM_SLUG[def.id]
      return slug ? presentSlugs.has(slug) : true
    }).map((def) => {
      const platformSlug = FEE_PLATFORM_SLUG[def.id]
      return {
        id: def.id,
        labelKey: def.labelKey,
        kind: 'subrow' as const,
        isDeduction: true,
        indent: true,
        format: 'money' as const,
        value: (_m: PlatformMetrics, colSlug: string): number | null => {
          if (!platformSlug) return 0
          if (colSlug === platformSlug) {
            return metrics[platformSlug]?.platform_fees_total ?? 0
          }
          if (colSlug === 'total') {
            return metrics[platformSlug]?.platform_fees_total ?? 0
          }
          return 0
        },
      }
    })

    const adsRows: PnlLine[] = ADS_SUBROW_DEFS.filter((def) => {
      if (def.id === 'ads_other') return tenantAdsSpend > 0
      return true
    }).map((def) => {
      if (def.alwaysNull) {
        return {
          id: def.id,
          labelKey: def.labelKey,
          kind: 'subrow' as const,
          isDeduction: true,
          indent: true,
          format: 'money' as const,
          value: (): number | null => null,
        }
      }
      if (def.id === 'ads_other') {
        return {
          id: def.id,
          labelKey: def.labelKey,
          kind: 'subrow' as const,
          isDeduction: true,
          indent: true,
          format: 'money' as const,
          value: (_m: PlatformMetrics, colSlug: string): number | null =>
            colSlug === 'total' ? tenantAdsSpend : 0,
        }
      }
      const network = ADS_NETWORK_FOR_LINE[def.id]
      return {
        id: def.id,
        labelKey: def.labelKey,
        kind: 'subrow' as const,
        isDeduction: true,
        indent: true,
        format: 'money' as const,
        value: (_m: PlatformMetrics, colSlug: string): number | null => {
          if (!network || !adsByPlatform) return 0
          return adsByPlatform[colSlug]?.byNetwork[network] ?? 0
        },
      }
    })

    const efficiency: PnlLine[] = [
      {
        id: 'tacos',
        labelKey: 'channelsEfficiencyTacos',
        kind: 'line',
        format: 'pct',
        value: (m) => tacosPct(m.ads_spend, m.net_revenue),
      },
      {
        id: 'roas',
        labelKey: 'channelsEfficiencyRoas',
        kind: 'line',
        format: 'ratio',
        value: (_m, colSlug) => {
          const rollup = adsByPlatform?.[colSlug]
          if (!rollup) return null
          return attributedRoas(rollup.attributedSales, rollup.linkedSpend)
        },
      },
    ]

    return [
      ...CORE_BEFORE_FEES,
      ...feeRows,
      ...AFTER_FEES,
      ...adsRows,
      ...AFTER_ADS,
      ...efficiency,
      ...footer,
    ]
  }, [adsByPlatform, footerMode, full, metrics, platforms, tenantAdsSpend])

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
          <DataTableColumnHeader column={column} title={t('reportsPnlColConcept')} />
        ),
        cell: ({ row }) => {
          const line = row.original
          const footerIds = new Set(['order_count', 'aov', 'units_sold', 'cm_per_unit'])
          const useResolver =
            !footerIds.has(line.id) &&
            line.kind !== 'subrow' &&
            line.id !== 'tacos' &&
            line.id !== 'roas'
          const label =
            line.id === 'contribution_margin' && cmIncomplete
              ? t('channelsCmProductScopeLabel')
              : useResolver
                ? labelForRow(line.id as PnlRowId)
                : t(line.labelKey)
          const prefix =
            line.kind === 'subrow'
              ? '• '
              : line.isDeduction && line.kind === 'line'
                ? '(−) '
                : line.kind === 'subtotal' || line.kind === 'total'
                  ? '= '
                  : ''
          return (
            <span
              className={cn(
                'text-text-primary',
                line.indent && 'pl-4',
                emphasisClass(line.kind),
                line.kind === 'subrow' && 'text-text-secondary',
              )}
              title={
                line.kind === 'subrow' && line.id.startsWith('fee_')
                  ? t('channelsFeeSubrowHint')
                  : undefined
              }
            >
              {prefix}
              {label}
            </span>
          )
        },
        meta: {
          cellClassName: 'align-middle overflow-hidden pr-6',
          headerClassName: 'overflow-hidden',
        },
      }),
      ...cols.map((col) =>
        columnHelper.display({
          id: col.slug,
          ...STATEMENT_VALUE_COLUMN_SIZE,
          header: ({ column }) => {
            const isTotal = col.slug === 'total'
            const { display, full: fullLabel, truncated } =
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
                  <span className="wrap-break-word">{fullLabel}</span>
                </TooltipContent>
              </Tooltip>
            )
          },
          cell: ({ row }) => {
            const line = row.original
            if (line.isNoData) {
              return (
                <span className="w-full text-right text-text-secondary">
                  {t('channelsNoData')}
                </span>
              )
            }
            const m = metrics[col.slug] ?? emptyMetricsStub(col.slug)
            const raw = line.value(m, col.slug)
            if (raw === null) {
              return (
                <span className="w-full text-right text-text-secondary">—</span>
              )
            }
            let formatted: string
            if (line.format === 'pct') {
              formatted = `${raw.toFixed(1)}%`
            } else if (line.format === 'ratio') {
              formatted = `${raw.toFixed(2)}x`
            } else if (line.format === 'count') {
              formatted = String(Math.round(raw))
            } else {
              const display = line.isDeduction ? -Math.abs(raw) : raw
              formatted = formatMoney(display)
            }
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
                {formatted}
                {margin !== null && margin !== undefined
                  ? ` (${margin.toFixed(1)}%)`
                  : ''}
              </span>
            )
          },
          meta: {
            headerClassName: 'text-right overflow-hidden',
            cellClassName: 'text-right overflow-hidden',
          },
        }),
      ),
    ],
    [byProduct, cmIncomplete, cols, formatMoney, labelForRow, metrics, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: lines,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
    ...statementTableColumnResize,
  })

  const title = byProduct ? t('channelsPnlTitleByProduct') : t('channelsPnlTitle')
  const description = cmIncomplete
    ? t('channelsPnlSubtitleProductScope')
    : byProduct
      ? t('channelsPnlSubtitleByProduct')
      : t('channelsPnlSubtitle')

  return (
    <SectionSplit title={title} description={description}>
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
