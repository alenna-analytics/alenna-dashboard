import { useMemo } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  type AdsNetworkId,
  type PlatformAdsRollup,
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
import { SettingsSectionHeader } from '@/pages/configuration/settings-layout'
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
  | 'fee_referral'
  | 'fee_fba'
  | 'fee_ml_sale'
  | 'fee_untracked'
  | 'fixed_opex'
  | 'ebitda'
  | 'ebitda_pct'
  | 'gross_margin_pct'
  | 'channel_margin_pct'
  | 'cm_pct'
  | 'tacos'
  | 'roas'

type PnlLine = {
  id: ChannelsPnlLineId
  labelKey: ShellStringKey
  hintKey?: ShellStringKey
  kind: 'line' | 'subtotal' | 'total' | 'subrow'
  isDeduction?: boolean
  isNoData?: boolean
  indent?: boolean
  format: 'money' | 'count' | 'pct' | 'ratio' | 'text'
  /** Shown instead of the number. `null` falls through to the numeric format. */
  textValue?: (m: PlatformMetrics, colSlug: string) => string | null
  /** Gross-margin style: blank the percent when this column has no COGS. */
  blankWhenCogsMissing?: boolean
  /** Append * when this column's COGS is missing. */
  starWhenCogsMissing?: boolean
  value: (m: PlatformMetrics, colSlug: string) => number | null
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
  },
  {
    id: 'gross_margin_pct',
    labelKey: 'reportsKpiMargenBrutoPct',
    kind: 'line',
    format: 'pct',
    blankWhenCogsMissing: true,
    starWhenCogsMissing: true,
    value: (m) => (m.net_revenue === 0 ? null : grossMarginPct(m)),
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
  },
  {
    id: 'channel_margin_pct',
    labelKey: 'productsGroupPnlChannelMarginPct',
    kind: 'line',
    format: 'pct',
    starWhenCogsMissing: true,
    value: (m) => channelMarginPct(m),
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
  { id: 'ads_ml', labelKey: 'channelsAdsMercado' },
  { id: 'ads_other', labelKey: 'channelsAdsOtherUnlinked' },
]

const AFTER_ADS: PnlLine[] = [
  {
    id: 'contribution_margin',
    labelKey: 'reportsWfContributionMargin',
    kind: 'total',
    format: 'money',
    value: (m) => m.contribution_margin,
  },
  {
    id: 'cm_pct',
    labelKey: 'productsGroupPnlCmPct',
    kind: 'line',
    format: 'pct',
    starWhenCogsMissing: true,
    value: (m) => (m.net_revenue === 0 ? null : m.contribution_margin_pct),
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

function wholeAmount(value: number, deduction: boolean, currency?: string): string {
  if (Math.abs(value) < 0.5) return '—'
  const rounded = Math.round(Math.abs(value))
  const text = rounded.toLocaleString()
  const withCurrency = currency ? `${text} ${currency}` : text
  return deduction ? `−${withCurrency}` : withCurrency
}

type ChannelsPnlTableProps = {
  metrics: Record<string, PlatformMetrics>
  platforms: ChannelPlatform[]
  t: (key: ShellStringKey) => string
  labelForRow: (id: PnlRowId) => string
  cmIncomplete?: boolean
  breakdown?: 'channel' | 'product'
  footerMode?: 'orders' | 'units'
  detailLevel?: ChannelsPnlDetailLevel
  adsByPlatform?: Record<string, PlatformAdsRollup>
  tenantAdsSpend?: number
  /** Line ids whose Total cell stays blank when Channels and Reports disagree. */
  blankTotalLineIds?: readonly string[]
  amountBasis?: 'money' | 'pct'
  /** ISO code of the amounts, shown after each money figure. */
  currency?: string
  /** Day-prorated fixed costs. Shown only on the Total column. */
  fixedOperatingExpenses?: number | null
}

function emphasisClass(kind: PnlLine['kind']): string {
  return kind === 'subtotal' || kind === 'total' ? 'font-semibold' : ''
}

function cogsMissing(metric: PlatformMetrics | undefined): boolean {
  if (!metric) return false
  return metric.net_revenue > 0.5 && Math.abs(metric.cogs) < 0.5
}

function isAmazon(slug: string): boolean {
  return slug.trim().toLowerCase() === 'amazon'
}

function isMercadoLibre(slug: string): boolean {
  const normalized = slug.trim().toLowerCase().replace(/_/g, '')
  return normalized === 'mercadolibre' || normalized === 'meli'
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
  t,
  labelForRow,
  cmIncomplete = false,
  breakdown = 'channel',
  footerMode = 'orders',
  detailLevel = 'core',
  adsByPlatform,
  tenantAdsSpend = 0,
  blankTotalLineIds = [],
  amountBasis = 'money',
  currency,
  fixedOperatingExpenses = null,
}: ChannelsPnlTableProps) {
  const byProduct = breakdown === 'product'
  const full = detailLevel === 'full'

  const lines = useMemo(() => {
    const footer =
      footerMode === 'units' ? FOOTER_UNITS : [...FOOTER_ORDERS, FOOTER_UNITS[0]]
    if (!full) {
      return [...CORE_BEFORE_FEES, ...AFTER_FEES, ...AFTER_ADS, ...footer]
    }

    const presentSlugs = new Set(platforms.map((p) => p.slug))
    const feeAmount = (slug: string, pick: 'referral_fees' | 'fulfillment_fees') =>
      metrics[slug]?.[pick] ?? 0
    const amazonSlug = platforms.find((platform) => isAmazon(platform.slug))?.slug
    const mlSlug = platforms.find((platform) => isMercadoLibre(platform.slug))?.slug
    const feeCandidates: Array<PnlLine | null> = [
      amazonSlug && Math.abs(feeAmount(amazonSlug, 'referral_fees')) >= 0.5
        ? {
            id: 'fee_referral',
            labelKey: 'channelsFeeReferral',
            kind: 'subrow',
            isDeduction: true,
            indent: true,
            format: 'money',
            value: (_m: PlatformMetrics, colSlug: string) =>
              colSlug === 'total' || colSlug === amazonSlug
                ? feeAmount(amazonSlug, 'referral_fees')
                : 0,
          }
        : null,
      amazonSlug && Math.abs(feeAmount(amazonSlug, 'fulfillment_fees')) >= 0.5
        ? {
            id: 'fee_fba',
            labelKey: 'channelsFeeFba',
            kind: 'subrow',
            isDeduction: true,
            indent: true,
            format: 'money',
            value: (_m: PlatformMetrics, colSlug: string) =>
              colSlug === 'total' || colSlug === amazonSlug
                ? feeAmount(amazonSlug, 'fulfillment_fees')
                : 0,
          }
        : null,
      mlSlug && Math.abs(feeAmount(mlSlug, 'referral_fees')) >= 0.5
        ? {
            id: 'fee_ml_sale',
            labelKey: 'channelsFeeMlSale',
            kind: 'subrow',
            isDeduction: true,
            indent: true,
            format: 'money',
            value: (_m: PlatformMetrics, colSlug: string) =>
              colSlug === 'total' || colSlug === mlSlug ? feeAmount(mlSlug, 'referral_fees') : 0,
          }
        : null,
      amazonSlug
        ? {
            id: 'fee_untracked',
            labelKey: 'channelsFeeUntracked',
            kind: 'subrow',
            indent: true,
            format: 'text',
            textValue: (_m: PlatformMetrics, colSlug: string) =>
              colSlug === 'total' || colSlug === amazonSlug ? t('channelsChargesToCapture') : null,
            value: () => null,
          }
        : null,
    ]
    const feeRows = feeCandidates.filter((row): row is PnlLine => row != null)
    const amazonHasSplit =
      !!amazonSlug &&
      (Math.abs(feeAmount(amazonSlug, 'referral_fees')) >= 0.5 ||
        Math.abs(feeAmount(amazonSlug, 'fulfillment_fees')) >= 0.5)
    const mlHasSplit = !!mlSlug && Math.abs(feeAmount(mlSlug, 'referral_fees')) >= 0.5
    const legacyFeeRows: PnlLine[] = FEE_SUBROW_DEFS.filter((def) => {
      const slug = FEE_PLATFORM_SLUG[def.id]
      if (!slug || !presentSlugs.has(slug)) return false
      if (slug === 'amazon' && amazonHasSplit) return false
      if (isMercadoLibre(slug) && mlHasSplit) return false
      return Math.abs(metrics[slug]?.platform_fees_total ?? 0) >= 0.5
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

    const adsNetworkSpend = (network: AdsNetworkId) =>
      Object.values(adsByPlatform ?? {}).reduce(
        (sum, rollup) => sum + (rollup.byNetwork[network] ?? 0),
        0,
      )
    const adsRows: PnlLine[] = ADS_SUBROW_DEFS.filter((def) => {
      if (def.alwaysNull) return false
      if (def.id === 'ads_other') return false
      if (def.id === 'ads_google') return adsNetworkSpend('google_ads') >= 0.5
      if (def.id === 'ads_amazon') return adsNetworkSpend('amazon_ads') >= 0.5
      if (def.id === 'ads_ml') return adsNetworkSpend('mercadolibre_ads') >= 0.5
      return false
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

    const beforeFees = CORE_BEFORE_FEES.map((line) =>
      line.id === 'cogs'
        ? {
            ...line,
            textValue: (metric: PlatformMetrics, colSlug: string) =>
              colSlug !== 'total' && cogsMissing(metric) ? t('channelsCogsUnloaded') : null,
          }
        : line,
    )
    const afterFees = AFTER_FEES.map((line) =>
      line.id === 'merchant_shipping'
        ? {
            ...line,
            textValue: (_metric: PlatformMetrics, colSlug: string) =>
              isAmazon(colSlug) ? t('channelsShippingIncludedInFba') : null,
          }
        : line,
    )
    const fixedCosts =
      fixedOperatingExpenses != null && Math.abs(fixedOperatingExpenses) >= 0.5
        ? [
            {
              id: 'fixed_opex' as const,
              labelKey: 'channelsFixedCosts' as const,
              hintKey: 'channelsFixedCostsHint' as const,
              kind: 'line' as const,
              isDeduction: true,
              format: 'money' as const,
              value: (_metric: PlatformMetrics, colSlug: string) =>
                colSlug === 'total' ? fixedOperatingExpenses : null,
            },
            {
              id: 'ebitda' as const,
              labelKey: 'reportsWfEbitda' as const,
              kind: 'total' as const,
              format: 'money' as const,
              value: (metric: PlatformMetrics, colSlug: string) =>
                colSlug === 'total' ? metric.contribution_margin - fixedOperatingExpenses : null,
            },
            {
              id: 'ebitda_pct' as const,
              labelKey: 'reportsKpiEbitdaMarginPct' as const,
              kind: 'line' as const,
              format: 'pct' as const,
              starWhenCogsMissing: true,
              value: (metric: PlatformMetrics, colSlug: string) => {
                if (colSlug !== 'total' || metric.net_revenue === 0) return null
                return (
                  ((metric.contribution_margin - fixedOperatingExpenses) / metric.net_revenue) * 100
                )
              },
            },
          ]
        : []

    return [
      ...beforeFees,
      ...feeRows,
      ...legacyFeeRows,
      ...afterFees,
      ...adsRows,
      ...AFTER_ADS,
      ...fixedCosts,
      ...footer,
    ]
  }, [
    adsByPlatform,
    fixedOperatingExpenses,
    footerMode,
    full,
    metrics,
    platforms,
    t,
    tenantAdsSpend,
  ])

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
          const footerIds = new Set(['order_count', 'aov', 'units_sold', 'cm_per_unit'])
          const useResolver =
            !footerIds.has(line.id) &&
            line.kind !== 'subrow' &&
            line.id !== 'tacos' &&
            line.id !== 'roas' &&
            line.id !== 'gross_margin_pct' &&
            line.id !== 'channel_margin_pct' &&
            line.id !== 'cm_pct' &&
            line.id !== 'ebitda_pct' &&
            line.id !== 'fixed_opex'
          const label = useResolver ? labelForRow(line.id as PnlRowId) : t(line.labelKey)
          const prefix =
            line.isDeduction && (line.kind === 'line' || line.kind === 'subrow')
              ? '(−) '
              : line.kind === 'subtotal' || line.kind === 'total'
                ? '= '
                : ''
          return (
            <span
              data-row-emphasis={line.id === 'contribution_margin' ? '' : undefined}
              className="flex min-w-0 flex-col gap-0.5 py-1"
              title={
                line.id === 'fee_shopify' || line.id === 'fee_amazon' || line.id === 'fee_ml'
                  ? t('channelsFeeSubrowHint')
                  : undefined
              }
            >
              <span
                className={cn(
                  'text-sm text-text-primary',
                  line.indent && 'pl-4',
                  emphasisClass(line.kind),
                )}
              >
                {prefix}
                {label}
              </span>
              {line.hintKey ? (
                <span className={cn('text-xs text-[#767676]', line.indent && 'pl-4')}>
                  {t(line.hintKey)}
                </span>
              ) : null}
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
            const { display, full: fullLabel, truncated } =
              byProduct && !isTotal
                ? truncateProductHeaderLabel(col.label)
                : { display: col.label, full: col.label, truncated: false }
            const missingCogs = !isTotal && cogsMissing(metrics[col.slug])
            const header = (
              <span className="flex w-full flex-col items-end gap-0.5 py-1">
                <span className="max-w-full truncate font-numeric text-xs font-medium uppercase text-[#767676]">
                  {display}
                </span>
                {missingCogs ? (
                  <span className="max-w-full truncate text-[11px] font-normal normal-case text-[#b45309]">
                    {t('channelsCogsUnloadedHeader')}
                  </span>
                ) : null}
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
                  <span className="wrap-break-word">{fullLabel}</span>
                </TooltipContent>
              </Tooltip>
            )
          },
          cell: ({ row }) => {
            const line = row.original
            const emphasize = line.id === 'contribution_margin'
            if (line.isNoData) {
              return (
                <span
                  data-row-emphasis={emphasize ? '' : undefined}
                  className="w-full py-1 text-right text-sm text-text-tertiary"
                >
                  {t('channelsNoData')}
                </span>
              )
            }
            const m = metrics[col.slug] ?? emptyMetricsStub(col.slug)
            const text = line.textValue?.(m, col.slug) ?? null
            const selfMissing =
              col.slug === 'total' ? cogsMissing(metrics.total) : cogsMissing(metrics[col.slug])
            const anyMissing =
              col.slug === 'total'
                ? platforms.some((platform) => cogsMissing(metrics[platform.slug]))
                : selfMissing
            let formatted = '—'
            let isText = false
            if (!(col.slug === 'total' && blankTotalLineIds.includes(line.id))) {
              if (text) {
                formatted = text
                isText = true
              } else if (line.blankWhenCogsMissing && selfMissing) {
                formatted = '—'
              } else {
                const raw = line.value(m, col.slug)
                if (raw == null || !Number.isFinite(raw)) {
                  formatted = '—'
                } else if (line.format === 'pct') {
                  formatted = `${raw.toFixed(1)}%`
                } else if (line.format === 'ratio') {
                  formatted = `${raw.toFixed(2)}x`
                } else if (line.format === 'count') {
                  formatted = Math.round(raw).toLocaleString()
                } else if (amountBasis === 'pct') {
                  const net = Math.abs(m.net_revenue)
                  formatted =
                    net < 0.5
                      ? '—'
                      : line.id === 'net_revenue'
                        ? '100%'
                        : `${((Math.abs(raw) / net) * 100).toFixed(1)}%`
                } else {
                  formatted = wholeAmount(raw, Boolean(line.isDeduction), currency)
                }
                if (
                  formatted !== '—' &&
                  line.starWhenCogsMissing &&
                  anyMissing &&
                  (line.format === 'pct' || amountBasis === 'pct')
                ) {
                  formatted = `${formatted}*`
                }
              }
            }
            const unloaded = formatted === t('channelsCogsUnloaded')
            return (
              <span
                data-row-emphasis={emphasize ? '' : undefined}
                className={cn(
                  'w-full py-1 text-right text-sm text-text-primary',
                  !isText && 'font-numeric tabular-nums',
                  emphasisClass(line.kind),
                  formatted === '—' && 'text-text-tertiary',
                  isText && !unloaded && 'text-text-tertiary',
                  unloaded && 'text-[#b45309]',
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
    [amountBasis, blankTotalLineIds, byProduct, cols, currency, labelForRow, metrics, platforms, t],
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
      : amountBasis === 'pct'
        ? t('channelsPctOfNet')
        : t('channelsPnlWithIva')

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
        emptyContent={<EmptyState size="sm" icon="channels" title={t('reportsNoData')} />}
        skeletonRowCount={8}
      />
    </section>
  )
}
