import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { TaxSettingsRates } from '@/lib/types/tax-settings'
import type { ProductLinkGroupApi, ProductLinkGroupSettlementApi } from '@/lib/types/product-links'
import { cn } from '@/lib/utils'
import { useTaxRatesQuery } from '@/pages/configuration/tax-rates/use-tax-rates-queries'
import { productPlatformLabel } from '@/pages/products/product-platform-label'
import { buildProductPnlWaterfallSegments } from '@/pages/products/product-detail-pnl-waterfall-segments'
import type { ProductPnlWaterfallSource } from '@/pages/products/product-detail-pnl-waterfall-segments'
import { buildSettlementWaterfallSegments } from '@/pages/reports/settlement-waterfall-segments'
import type { Segment } from '@/pages/reports/waterfall-chart'
import {
  computeShiftedPreviousPeriod,
  pctVersusPrevious,
} from '@/pages/reports/reports-ui-helpers'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import { InfoTooltip } from '@/ui/info-tooltip'
import { KpiCard } from '@/ui/kpi-card'
import { Skeleton } from '@/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

import { calendarYearToDateRange } from '../calendar-year-to-date'
import { ProductDetailWaterfallBlock } from '../product-detail-waterfall-block'
import { GroupCobroAside } from './group-cobro-aside'
import { ivaDivisor, unitCostsDiffer } from './group-rentabilidad'
import {
  buildGroupStatement,
  finalizeGroupStatement,
  membersToStatement,
  payoutPct as payoutPctOf,
  platformsToStatement,
} from './group-statement'
import { buildCobroStatementRows, buildPnlStatementRows, countLabel } from './group-statement-rows'
import { GroupStatementTable } from './group-statement-table'
import { formatInsightRange } from './group-weekly-sales'
import {
  GROUP_INSIGHT_ALL_PRODUCTS,
  selectFilteredGroupMembers,
} from './group-insight-dimension'
import { useGroupInsight } from './use-group-insight'
import { useProductLinkGroupQuery } from './use-product-link-queries'

type ShellT = (key: ShellStringKey) => string
type Vista = 'pnl' | 'cobro'
type Breakdown = 'channel' | 'publication'
type CobroBasis = 'total' | 'unit'

type VinculacionGroupRentabilidadProps = {
  group: ProductLinkGroupApi
  lang: string
  t: ShellT
  baseCurrency: string
  fmtBase: (value: number) => string
  fmtCard: (value: number) => string
  insightStart: string
  insightEnd: string
  setInsightStart: (value: string) => void
  setInsightEnd: (value: string) => void
  pickerStrings: DateRangePickerStrings
  insightsFetching: boolean
}

const PNL_SEGMENT_KEYS: ShellStringKey[] = [
  'reportsWfGrossRevenue',
  'productsGroupWfDiscounts',
  'reportsWfNetRevenue',
  'reportsWfCogs',
  'reportsWfGrossProfit',
  'productsGroupWfFees',
  'productsGroupWfShipping',
  'productsDetailChannelMargin',
  'productsGroupWfAds',
  'productsGroupWfContribution',
]

const COBRO_SEGMENT_KEYS: ShellStringKey[] = [
  'settlementWfGross',
  'productsGroupWfDiscounts',
  'settlementWfNetSales',
  'productsGroupWfFees',
  'productsGroupWfShipping',
  'productsGroupWfWithholdings',
  'productsGroupWfNetPayout',
]

function groupStatement(
  group: ProductLinkGroupApi,
  members: ProductLinkGroupApi['members'],
  mode: 'channel' | 'publication',
  t: ShellT,
  taxRates: TaxSettingsRates | null,
) {
  const built = buildGroupStatement({
    members: membersToStatement(members),
    platforms: platformsToStatement(group),
    mode,
    labelForPlatform: (platform) => productPlatformLabel(platform, t),
  })
  return finalizeGroupStatement(built.columns, taxRates)
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value == null ? match : String(value)
  })
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  ariaLabel: string
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded-lg border border-border-default bg-white p-0.5"
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-7 cursor-pointer rounded-md px-3 text-xs font-medium transition-colors',
              selected
                ? 'bg-text-primary text-white'
                : 'text-[#767676] hover:text-text-primary',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function renameSegments(segments: Segment[], names: string[]): Segment[] {
  if (segments.length !== names.length) return segments
  return segments.map((segment, index) => ({
    ...segment,
    name: names[index] ?? segment.name,
  }))
}

function scaleSource(
  source: ProductPnlWaterfallSource,
  factor: number,
): ProductPnlWaterfallSource {
  if (factor === 1) return source
  return {
    grossSales: source.grossSales * factor,
    netSales: source.netSales * factor,
    cogs: source.cogs * factor,
    grossProfit: source.grossProfit * factor,
    channelMargin: source.channelMargin * factor,
    adsAssigned: source.adsAssigned * factor,
    contributionMargin: source.contributionMargin * factor,
    discounts: source.discounts * factor,
    returns: source.returns * factor,
    marketplaceFees: source.marketplaceFees * factor,
    shippingCharges: source.shippingCharges * factor,
  }
}

function scaleSettlement(
  settlement: ProductLinkGroupSettlementApi,
  factor: number,
): ProductLinkGroupSettlementApi {
  if (factor === 1) return settlement
  return {
    ...settlement,
    gross_revenue: settlement.gross_revenue * factor,
    discounts: settlement.discounts * factor,
    returns: settlement.returns * factor,
    net_revenue: settlement.net_revenue * factor,
    marketplace_fees: settlement.marketplace_fees * factor,
    shipping_charges: settlement.shipping_charges * factor,
    tax_withholdings: settlement.tax_withholdings * factor,
    estimated_payout: settlement.estimated_payout * factor,
  }
}

function shareOfNet(part: number, net: number, template: string): string {
  if (!(net > 0)) return '—'
  return fill(template, { pct: ((part / net) * 100).toFixed(1) })
}

export function VinculacionGroupRentabilidad({
  group,
  lang,
  t,
  baseCurrency,
  fmtCard,
  insightStart,
  insightEnd,
  setInsightStart,
  setInsightEnd,
  pickerStrings,
  insightsFetching,
}: VinculacionGroupRentabilidadProps) {
  const insight = useGroupInsight()
  const { me } = useWorkspace()
  const taxRatesQuery = useTaxRatesQuery()
  const [vista, setVista] = useState<Vista>('pnl')
  const [includeIva, setIncludeIva] = useState(true)
  const [breakdown, setBreakdown] = useState<Breakdown>('channel')
  const [cobroBasis, setCobroBasis] = useState<CobroBasis>('total')

  const taxRates = taxRatesQuery.data?.settings ?? null
  const taxUnset = taxRatesQuery.isSuccess && taxRates == null
  const pnlFactor = ivaDivisor(includeIva, taxRates?.transferred_iva_pct)

  const selection = useMemo(
    () =>
      selectFilteredGroupMembers(group, {
        dimension: 'channel',
        channelFilter: insight.channelFilter,
        productFilter: GROUP_INSIGHT_ALL_PRODUCTS,
      }),
    [group, insight.channelFilter],
  )
  const statementMode: 'channel' | 'publication' =
    vista === 'cobro' || breakdown === 'channel' ? 'channel' : 'publication'
  const statement = useMemo(
    () => groupStatement(group, selection.members, statementMode, t, taxRates),
    [group, selection.members, statementMode, t, taxRates],
  )
  const totals = statement.total
  const units = {
    sold: totals.grossUnits,
    net: totals.netUnits,
    returned: Math.max(0, totals.grossUnits - totals.netUnits),
  }

  const ytdRange = useMemo(() => calendarYearToDateRange(), [])
  const ytdGroupQuery = useProductLinkGroupQuery(group.id, ytdRange.start, ytdRange.end)
  const yearWithheld = useMemo(() => {
    const ytdGroup = ytdGroupQuery.data
    if (!ytdGroup) return null
    return groupStatement(ytdGroup, ytdGroup.members, 'channel', t, taxRates).total.tax
  }, [t, taxRates, ytdGroupQuery.data])

  const kpiPrevPeriod = useMemo(
    () => computeShiftedPreviousPeriod(insightStart, insightEnd),
    [insightEnd, insightStart],
  )
  const prevGroupQuery = useProductLinkGroupQuery(
    kpiPrevPeriod ? group.id : undefined,
    kpiPrevPeriod?.start ?? '',
    kpiPrevPeriod?.end ?? '',
  )
  const prevNetSales = useMemo(() => {
    const prevGroup = prevGroupQuery.data
    if (!prevGroup) return null
    const prevSelection = selectFilteredGroupMembers(prevGroup, {
      dimension: 'channel',
      channelFilter: insight.channelFilter,
      productFilter: GROUP_INSIGHT_ALL_PRODUCTS,
    })
    return groupStatement(prevGroup, prevSelection.members, 'channel', t, taxRates).total.net
  }, [insight.channelFilter, prevGroupQuery.data, t, taxRates])

  const previousReady = Boolean(kpiPrevPeriod) && !prevGroupQuery.isLoading
  const salesDelta =
    previousReady && prevNetSales != null && prevNetSales > 0
      ? pctVersusPrevious(totals.net, prevNetSales)
      : null

  const pnlSource = useMemo(
    () =>
      scaleSource(
        {
          grossSales: totals.gross,
          netSales: totals.net,
          cogs: totals.cogs,
          grossProfit: totals.grossProfit,
          channelMargin: totals.channelMargin,
          adsAssigned: totals.ads,
          contributionMargin: totals.contribution,
          discounts: totals.discounts,
          returns: totals.returns,
          marketplaceFees: totals.fees,
          shippingCharges: totals.shipping,
        },
        pnlFactor,
      ),
    [pnlFactor, totals],
  )
  const pnlSegments = useMemo(
    () =>
      renameSegments(
        buildProductPnlWaterfallSegments(pnlSource, t),
        PNL_SEGMENT_KEYS.map((key) => t(key)),
      ),
    [pnlSource, t],
  )

  const cobroScale = cobroBasis === 'total' ? 1 : units.net > 0 ? 1 / units.net : 0
  const cobroSettlement = useMemo((): ProductLinkGroupSettlementApi => {
    return scaleSettlement(
      {
        gross_revenue: totals.gross,
        discounts: totals.discounts,
        returns: totals.returns,
        net_revenue: totals.net,
        marketplace_fees: totals.fees,
        shipping_charges: totals.shipping,
        tax_withholdings: totals.tax,
        estimated_payout: totals.payout,
        completeness: 'full',
      },
      cobroScale,
    )
  }, [cobroScale, totals])
  const cobroSegments = useMemo(
    () =>
      renameSegments(
        buildSettlementWaterfallSegments(cobroSettlement, t, { includeTaxWithholdings: true }),
        COBRO_SEGMENT_KEYS.map((key) => t(key)),
      ),
    [cobroSettlement, t],
  )

  const cogsDiffer = unitCostsDiffer(selection.members.map((member) => member.cost))
  const shareTemplate = t('productsGroupCardShareOfNet')
  const unitSuffix = t('productsGroupAnalyticsUnitSuffix')
  const kpiSkeleton = <Skeleton className="mt-0.5 h-6 w-24 max-w-full" aria-hidden />
  const showCobroMoney = cobroBasis === 'total' || units.net > 0
  const payoutPct = payoutPctOf(totals)

  const salesFooter: ReactNode = !previousReady ? (
    <Skeleton className="h-3 w-28" aria-hidden />
  ) : salesDelta ? (
    <span
      className={
        salesDelta.trend === 'up'
          ? 'text-[var(--kpi-pill-positive-text)]'
          : salesDelta.trend === 'down'
            ? 'text-[var(--kpi-pill-negative-text)]'
            : 'text-[#767676]'
      }
    >
      {`${salesDelta.pct > 0 ? '+' : ''}${salesDelta.pct.toFixed(1)}%`}
    </span>
  ) : (
    <span className="text-[#767676]">{t('productsGroupAnalyticsNoHistory')}</span>
  )

  const money = (value: number | null) =>
    insightsFetching || value == null ? null : fmtCard(value)

  const knownCosts = selection.members
    .map((member) => member.cost)
    .filter((cost): cost is number => cost != null && Number.isFinite(cost))
  const uniformCost = !cogsDiffer && knownCosts.length > 0 ? knownCosts[0] : null
  const cogsHint =
    uniformCost != null
      ? fill(t('productsGroupPnlCogsHint'), { cost: fmtCard(uniformCost) })
      : cogsDiffer
        ? t('productsGroupCardCogsDiff')
        : t('productsGroupCardCogsSame')
  const publicationDetail = (count: number) =>
    countLabel(
      count,
      t('productsGroupStatementPublication'),
      t('productsGroupStatementPublications'),
    )
  const columnDetails: Record<string, string> = {
    total:
      statementMode === 'publication'
        ? publicationDetail(statement.columns.length)
        : countLabel(
            statement.columns.length,
            t('productsGroupStatementChannel'),
            t('productsGroupStatementChannels'),
          ),
  }
  for (const column of statement.columns) {
    columnDetails[column.id] =
      statementMode === 'publication'
        ? productPlatformLabel(column.platform, t)
        : publicationDetail(column.publicationCount)
  }
  const pnlRows = buildPnlStatementRows({
    columns: statement.columns,
    total: totals,
    factor: pnlFactor,
    cogsHint,
    t,
  })
  const cobroRows = buildCobroStatementRows({
    columns: statement.columns,
    total: totals,
    transferredIvaPct: taxRates?.transferred_iva_pct ?? 16,
    t,
  })
  const tenantName = me?.tenant_name?.trim() || t('shellSidebarWorkspaceFallback')
  const rangeLabel = formatInsightRange(insightStart, insightEnd, lang)
  const formatWhole = (value: number) =>
    Math.round(Math.abs(value)).toLocaleString(lang === 'en' ? 'en-US' : 'es-MX')

  return (
    <div className="flex flex-col gap-8">
      <Card className="rounded-none border-none p-0 shadow-none hover:shadow-none">
        <CardHeader className="flex flex-col gap-3 p-0">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <DateRangePicker
                strings={pickerStrings}
                startValue={insightStart}
                endValue={insightEnd}
                onStartChange={(value) => value && setInsightStart(value)}
                onEndChange={(value) => value && setInsightEnd(value)}
                className="w-full max-w-md"
              />
              <FilterComboboxSingle
                label={t('homeFilterChannels')}
                options={insight.channelOptions}
                value={insight.channelFilter}
                onValueChange={insight.setChannelFilter}
                searchPlaceholder={t('homeFilterChannelsSearch')}
                emptyLabel={t('homeFilterChannelsEmpty')}
                allowClear={false}
                triggerClassName="w-full sm:w-auto sm:min-w-[12rem]"
              />
            </div>
            <div className="flex shrink-0 flex-row flex-nowrap items-center justify-end gap-2">
              {vista === 'pnl' ? (
                <>
                  <FilterComboboxSingle
                    label={t('productsGroupIvaFilter')}
                    options={[
                      { value: 'with', label: t('productsGroupIvaOn') },
                      { value: 'without', label: t('productsGroupIvaOff') },
                    ]}
                    value={includeIva ? 'with' : 'without'}
                    onValueChange={(value) => setIncludeIva(value !== 'without')}
                    searchPlaceholder={t('productsSearchPlaceholder')}
                    emptyLabel={t('productsVinculacionPickerEmpty')}
                    allowClear={false}
                    triggerClassName="cursor-pointer"
                  />
                  <FilterComboboxSingle
                    label={t('productsGroupBreakdownFilter')}
                    options={[
                      { value: 'channel', label: t('productsGroupByChannel') },
                      { value: 'publication', label: t('productsGroupByPublication') },
                    ]}
                    value={breakdown}
                    onValueChange={(value) => {
                      if (value === 'channel' || value === 'publication') setBreakdown(value)
                    }}
                    searchPlaceholder={t('productsSearchPlaceholder')}
                    emptyLabel={t('productsVinculacionPickerEmpty')}
                    allowClear={false}
                    triggerClassName="cursor-pointer"
                  />
                </>
              ) : (
                <SegmentedControl
                  ariaLabel={t('productsGroupCobroTotal')}
                  value={cobroBasis}
                  onChange={setCobroBasis}
                  options={[
                    { value: 'total', label: t('productsGroupCobroTotal') },
                    { value: 'unit', label: t('productsGroupCobroPerUnit') },
                  ]}
                />
              )}
              <SegmentedControl
                ariaLabel={t('productsDetailTabPlatformPayment')}
                value={vista}
                onChange={setVista}
                options={[
                  { value: 'pnl', label: t('productsGroupRentabilidadPnl') },
                  { value: 'cobro', label: t('productsGroupRentabilidadCobro') },
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-0 pt-4">
          {vista === 'cobro' && taxUnset ? (
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
          ) : null}
          {vista === 'pnl' ? (
            <div className="grid grid-cols-1 items-stretch gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                className="h-full"
                label={t('productsDetailPlatformPaymentNetSales')}
                value={insightsFetching ? kpiSkeleton : fmtCard(totals.net * pnlFactor)}
                currencyCode={insightsFetching ? undefined : baseCurrency}
                showComparison={false}
                footerClassName="text-xs text-[#767676]"
                footer={salesFooter}
              />
              <KpiCard
                className="h-full"
                label={t('productsDetailKpiGrossProfit')}
                value={
                  insightsFetching ? kpiSkeleton : fmtCard(totals.grossProfit * pnlFactor)
                }
                currencyCode={insightsFetching ? undefined : baseCurrency}
                showComparison={false}
                footerClassName="text-xs text-[#767676]"
                footer={
                  <span className="text-[#767676]">
                    {shareOfNet(totals.grossProfit, totals.net, shareTemplate)}
                  </span>
                }
              />
              <KpiCard
                className="h-full"
                label={t('productsDetailChannelMargin')}
                value={insightsFetching ? kpiSkeleton : fmtCard(totals.channelMargin * pnlFactor)}
                currencyCode={insightsFetching ? undefined : baseCurrency}
                showComparison={false}
                footerClassName="text-xs text-[#767676]"
                footer={
                  <span className="text-[#767676]">
                    {shareOfNet(totals.channelMargin, totals.net, shareTemplate)}
                  </span>
                }
              />
              <KpiCard
                className="h-full"
                label={t('reportsContributionMargin')}
                value={
                  insightsFetching ? kpiSkeleton : fmtCard(totals.contribution * pnlFactor)
                }
                currencyCode={insightsFetching ? undefined : baseCurrency}
                showComparison={false}
                footerClassName="text-xs text-[#767676]"
                footer={
                  <span className="text-[#767676]">
                    {shareOfNet(totals.contribution, totals.net, shareTemplate)}
                  </span>
                }
              />
              <KpiCard
                className="h-full"
                label={t('productsDetailKpiNetUnitsSold')}
                value={
                  insightsFetching
                    ? kpiSkeleton
                    : `${units.net.toLocaleString()} ${unitSuffix}`
                }
                showComparison={false}
                footerClassName="text-xs text-[#767676]"
                footer={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="w-fit cursor-default text-left text-[#767676] underline decoration-dotted underline-offset-2"
                      >
                        {t('productsGroupCardUnitsHint')}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {fill(t('productsGroupAnalyticsUnitsBreakdown'), {
                        sold: units.sold.toLocaleString(),
                        returned: units.returned.toLocaleString(),
                      })}
                    </TooltipContent>
                  </Tooltip>
                }
              />
              <KpiCard
                className="h-full"
                label={t('productsGroupCardCmPerUnit')}
                value={
                  insightsFetching
                    ? kpiSkeleton
                    : money(units.net > 0 ? (totals.contribution * pnlFactor) / units.net : null) ??
                      '—'
                }
                currencyCode={insightsFetching || !(units.net > 0) ? undefined : baseCurrency}
                showComparison={false}
                footerClassName="text-xs text-[#767676]"
                footer={
                  <span className="text-[#767676]">{t('productsGroupCardCmPerUnitHint')}</span>
                }
              />
              <KpiCard
                className="h-full"
                label={t('productsDetailAvgPrice')}
                value={
                  insightsFetching
                    ? kpiSkeleton
                    : money(units.net > 0 ? (totals.net * pnlFactor) / units.net : null) ??
                      '—'
                }
                currencyCode={insightsFetching || !(units.net > 0) ? undefined : baseCurrency}
                showComparison={false}
                footerClassName="text-xs text-[#767676]"
                footer={
                  <span className="text-[#767676]">{t('productsGroupCardAvgPriceHint')}</span>
                }
              />
              <KpiCard
                className="h-full"
                label={t('productsDetailUnitCogs')}
                value={
                  insightsFetching
                    ? kpiSkeleton
                    : money(units.net > 0 ? (totals.cogs * pnlFactor) / units.net : null) ??
                      '—'
                }
                currencyCode={insightsFetching || !(units.net > 0) ? undefined : baseCurrency}
                showComparison={false}
                footerClassName="text-xs text-[#767676]"
                footer={
                  <span className="text-[#767676]">
                    {cogsDiffer
                      ? t('productsGroupCardCogsDiff')
                      : t('productsGroupCardCogsSame')}
                  </span>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                className="h-full"
                label={t('productsDetailPlatformPaymentNetSales')}
                value={
                  insightsFetching || !showCobroMoney
                    ? insightsFetching
                      ? kpiSkeleton
                      : '—'
                    : fmtCard(totals.net * cobroScale)
                }
                currencyCode={insightsFetching || !showCobroMoney ? undefined : baseCurrency}
                showComparison={false}
                footerClassName="text-xs text-[#767676]"
                footer={<span className="text-[#767676]">{t('productsGroupIvaOn')}</span>}
              />
              <KpiCard
                className="h-full"
                label={t('productsDetailPlatformPaymentRetainedSat')}
                value={
                  insightsFetching || !showCobroMoney
                    ? insightsFetching
                      ? kpiSkeleton
                      : '—'
                    : fmtCard(totals.tax * cobroScale)
                }
                currencyCode={insightsFetching || !showCobroMoney ? undefined : baseCurrency}
                showComparison={false}
                footerClassName="text-xs text-[#767676]"
                footer={
                  <span className="inline-flex items-center gap-1 text-[#767676]">
                    {t('productsGroupCobroRetainedFooter')}
                    <InfoTooltip side="bottom">{t('productsGroupCobroRetainedTooltip')}</InfoTooltip>
                  </span>
                }
              />
              <KpiCard
                className="h-full"
                label={t('productsGroupCobroNeto')}
                value={
                  insightsFetching || !showCobroMoney
                    ? insightsFetching
                      ? kpiSkeleton
                      : '—'
                    : fmtCard(totals.payout * cobroScale)
                }
                currencyCode={insightsFetching || !showCobroMoney ? undefined : baseCurrency}
                showComparison={false}
                footerClassName="text-xs text-[#767676]"
                footer={
                  <span className="text-[#767676]">
                    {cobroBasis === 'unit'
                      ? t('productsGroupCardCmPerUnitHint')
                      : t('productsGroupCobroMatchesTable')}
                  </span>
                }
              />
              <KpiCard
                className="h-full"
                label={t('productsDetailPlatformPaymentPayoutPct')}
                helpText={t('productsGroupCobroAlwaysIva')}
                value={insightsFetching ? kpiSkeleton : payoutPct == null ? '—' : `${payoutPct.toFixed(1)}%`}
                showComparison={false}
                footerClassName="text-xs text-[#767676]"
                footer={
                  <span className="text-[#767676]">{t('productsGroupCobroPayoutFooter')}</span>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ProductDetailWaterfallBlock
        title={
          vista === 'pnl'
            ? t('productsGroupPnlWaterfallTitle')
            : t('productsGroupCobroWaterfallTitle')
        }
        description={
          vista === 'pnl'
            ? t('productsGroupPnlWaterfallSubtitle')
            : t('productsGroupCobroWaterfallSubtitle')
        }
        segments={vista === 'pnl' ? pnlSegments : cobroSegments}
        currency={baseCurrency}
        grossRevenue={
          vista === 'pnl' ? pnlSource.grossSales : cobroSettlement.gross_revenue
        }
        t={t}
        finalBarCaption={
          vista === 'pnl' ? t('productsGroupWfContribution') : t('productsGroupWfNetPayout')
        }
        isLoading={insightsFetching}
      />

      {vista === 'pnl' ? (
        <>
          <GroupStatementTable
            title={
              statementMode === 'publication'
                ? t('productsGroupPnlTableTitlePublication')
                : t('productsGroupPnlTableTitle')
            }
            description={
              statementMode === 'publication'
                ? t('productsGroupPnlTableSubtitlePublication')
                : t('productsGroupPnlTableSubtitle')
            }
            columns={statement.columns}
            total={totals}
            details={columnDetails}
            rows={pnlRows}
            lang={lang}
            t={t}
            formatPrice={fmtCard}
          />
          <div className="rounded-lg border border-border-subtle bg-muted/40 px-4 py-3">
            <p className="text-sm text-text-secondary">
              {fill(t('productsGroupPnlRetention'), {
                amount: formatWhole(totals.tax),
              })}
            </p>
            <button
              type="button"
              className="mt-2 cursor-pointer text-sm font-medium text-text-primary underline underline-offset-2 transition-opacity hover:opacity-70"
              onClick={() => setVista('cobro')}
            >
              {t('productsGroupPnlViewCobro')}
            </button>
          </div>
          <p className="mb-16 text-xs text-[#767676]">
            {fill(t('productsGroupPnlDisclaimer'), { tenant: tenantName, range: rangeLabel })}
          </p>
        </>
      ) : (
        <>
          <GroupStatementTable
            title={t('productsGroupCobroTableTitle')}
            description={t('productsGroupCobroTableSubtitle')}
            columns={statement.columns}
            total={totals}
            details={columnDetails}
            rows={cobroRows}
            lang={lang}
            t={t}
            formatPrice={fmtCard}
          />
          <GroupCobroAside
            columns={statement.columns}
            total={totals}
            transferredIvaPct={taxRates?.transferred_iva_pct ?? 16}
            isrPct={taxRates?.withholding_isr_pct ?? null}
            ivaPct={taxRates?.withholding_iva_pct ?? null}
            formatWhole={formatWhole}
            formatMoney={fmtCard}
            currencyCode={baseCurrency}
            yearWithheld={yearWithheld}
            yearWithheldLoading={ytdGroupQuery.isFetching}
            t={t}
          />
          <p className="mb-16 text-xs text-[#767676]">
            {fill(t('productsGroupCobroDisclaimer'), { tenant: tenantName, range: rangeLabel })}
          </p>
        </>
      )}
    </div>
  )
}
