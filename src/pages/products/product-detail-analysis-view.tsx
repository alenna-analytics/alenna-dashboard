import { useMemo, type ReactNode } from 'react'

import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import {
  computeShiftedPreviousPeriod,
  historyIsComparable,
  pctVersusPrevious,
} from '@/pages/reports/reports-ui-helpers'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import type { FilterOption } from '@/ui/filters/types'
import { KpiCard } from '@/ui/kpi-card'
import { Skeleton } from '@/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

import { buildProductCoverRows } from './product-detail-cover'
import {
  connectionIdsForPlatform,
  platformSlugsFromDetail,
  PRODUCT_DETAIL_ALL_CHANNELS,
} from './product-detail-analytics-filter'
import { productStatement } from './product-detail-statement'
import { productPlatformLabel } from './product-platform-label'
import { GroupChannelCoverTable } from './vinculacion/group-channel-cover-table'
import { formatInsightRange } from './vinculacion/group-weekly-sales'
import { GroupWeeklyNetSalesChart } from './vinculacion/group-weekly-net-sales-chart'
import { useProductDetailQuery } from './use-catalog-queries'

type ShellT = (key: ShellStringKey) => string

type ProductDetailAnalysisViewProps = {
  productId: string
  lang: string
  detail: ProductDetailApi
  t: ShellT
  baseCurrency: string
  fmtBase: (value: number) => string
  fmtCard: (value: number) => string
  insightStart: string
  insightEnd: string
  setInsightStart: (value: string) => void
  setInsightEnd: (value: string) => void
  channelFilter: string
  setChannelFilter: (value: string) => void
  pickerStrings: DateRangePickerStrings
  insightsFetching: boolean
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value == null ? match : String(value)
  })
}

function PlatformDetail({
  label,
  lines,
}: {
  label: string
  lines: { id: string; text: string }[]
}) {
  if (lines.length === 0) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="w-fit cursor-default text-left text-[11px] text-text-tertiary underline decoration-dotted underline-offset-2"
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="font-normal">
        <ul className="space-y-1">
          {lines.map((line) => (
            <li key={line.id}>{line.text}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}

export function ProductDetailAnalysisView({
  productId,
  lang,
  detail,
  t,
  baseCurrency,
  fmtBase,
  fmtCard,
  insightStart,
  insightEnd,
  setInsightStart,
  setInsightEnd,
  channelFilter,
  setChannelFilter,
  pickerStrings,
  insightsFetching,
}: ProductDetailAnalysisViewProps) {
  const { me } = useWorkspace()
  const connectionsQuery = usePlatformConnectionsQuery()
  const today = useMemo(() => new Date(), [])
  const kpiSkeleton = <Skeleton className="mt-0.5 h-6 w-24 max-w-full" aria-hidden />
  const platformSlugs = useMemo(() => platformSlugsFromDetail(detail), [detail])
  const activeChannel =
    channelFilter === PRODUCT_DETAIL_ALL_CHANNELS || platformSlugs.includes(channelFilter)
      ? channelFilter
      : PRODUCT_DETAIL_ALL_CHANNELS

  const channelOptions = useMemo((): FilterOption[] => {
    const allOption: FilterOption = {
      value: PRODUCT_DETAIL_ALL_CHANNELS,
      label: t('homeFilterChannelsAll'),
    }
    const platformOptions = platformSlugs.map((slug) => {
      const sourceSlug =
        detail.period_by_platform.find((row) => row.platform.trim().toLowerCase() === slug)
          ?.platform ??
        detail.listings.find((listing) => listing.platform.trim().toLowerCase() === slug)
          ?.platform ??
        slug
      return { value: slug, label: productPlatformLabel(sourceSlug, t) }
    })
    return [allOption, ...platformOptions]
  }, [detail.listings, detail.period_by_platform, platformSlugs, t])

  const coverRows = useMemo(
    () => buildProductCoverRows(detail, activeChannel, today),
    [activeChannel, detail, today],
  )
  const channelRows = coverRows.filter((row) => !row.isTotal)
  const totalRow = coverRows.find((row) => row.isTotal)

  const statement = useMemo(
    () => productStatement(detail, 'channel', activeChannel, (platform) => platform, null),
    [activeChannel, detail],
  )
  const units = {
    sold: statement.total.grossUnits,
    net: statement.total.netUnits,
    returned: Math.max(0, statement.total.grossUnits - statement.total.netUnits),
  }

  const chartConnectionIds = useMemo(
    () => connectionIdsForPlatform(connectionsQuery.data, activeChannel),
    [connectionsQuery.data, activeChannel],
  )
  const { data: series, isError, isFetching: seriesFetching } = useMonthlyRevenueSeries({
    productIds: [productId],
    connectionIds: chartConnectionIds,
    startDate: insightStart,
    endDate: insightEnd,
    granularity: 'week',
    enabled: Boolean(productId && insightStart && insightEnd),
  })

  const kpiPrevPeriod = useMemo(
    () => computeShiftedPreviousPeriod(insightStart, insightEnd),
    [insightEnd, insightStart],
  )
  const prevDetailQuery = useProductDetailQuery(
    kpiPrevPeriod ? productId : undefined,
    kpiPrevPeriod
      ? { metricsStart: kpiPrevPeriod.start, metricsEnd: kpiPrevPeriod.end }
      : undefined,
  )
  const prevNetSales = useMemo(() => {
    const prev = prevDetailQuery.data
    if (!prev) return null
    return productStatement(prev, 'channel', activeChannel, (platform) => platform, null).total.net
  }, [activeChannel, prevDetailQuery.data])

  const previousReady = Boolean(kpiPrevPeriod) && !prevDetailQuery.isLoading
  const comparableHistory = historyIsComparable({
    previousValue: prevNetSales,
    previousStart: kpiPrevPeriod?.start,
  })
  const salesDelta =
    previousReady && comparableHistory && prevNetSales != null
      ? pctVersusPrevious(statement.total.net, prevNetSales)
      : null

  const perDay = t('productsDetailInventoryVelocityUnit')
  const daysSuffix = t('productsDetailKpiInventoryDaysSuffix')
  const platformDetailLabel = t('productsGroupAnalyticsPlatformDetail')
  const unitSuffix = t('productsGroupAnalyticsUnitSuffix')

  const velocityLines = channelRows
    .filter((row) => row.velocity != null && row.velocity > 0)
    .map((row) => ({
      id: row.id,
      text: `${productPlatformLabel(row.platform, t)} ${row.velocity?.toLocaleString(undefined, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      })} ${perDay}`,
    }))
  const daysLines = channelRows
    .filter((row) => row.inventoryDays != null)
    .map((row) => ({
      id: row.id,
      text: `${productPlatformLabel(row.platform, t)} ${row.inventoryDays?.toLocaleString(undefined, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      })} ${daysSuffix}`,
    }))

  const velocityValue =
    totalRow?.velocity != null
      ? `${totalRow.velocity.toLocaleString(undefined, {
          maximumFractionDigits: 1,
          minimumFractionDigits: 1,
        })} ${perDay}`
      : t('productsDetailKpiNoData')
  const daysValue =
    totalRow?.inventoryDays != null
      ? `${totalRow.inventoryDays.toLocaleString(undefined, {
          maximumFractionDigits: 1,
          minimumFractionDigits: 1,
        })} ${daysSuffix}`
      : t('productsDetailKpiNoData')

  const tenantName = me?.tenant_name?.trim() || t('shellSidebarWorkspaceFallback')
  const rangeLabel = formatInsightRange(insightStart, insightEnd, lang)
  const dataNote = [
    fill(t('productsGroupAnalyticsDataNote'), { tenant: tenantName, range: rangeLabel }),
    previousReady && !comparableHistory ? t('productsGroupAnalyticsNoCompareReason') : null,
  ]
    .filter(Boolean)
    .join(' ')

  const salesFooter: ReactNode = !previousReady ? (
    <Skeleton className="h-3 w-28" aria-hidden />
  ) : comparableHistory && salesDelta ? (
    <span
      className={
        salesDelta.trend === 'up'
          ? 'text-[var(--kpi-pill-positive-text)]'
          : salesDelta.trend === 'down'
            ? 'text-[var(--kpi-pill-negative-text)]'
            : 'text-text-tertiary'
      }
    >
      {`${salesDelta.pct > 0 ? '+' : ''}${salesDelta.pct.toFixed(1)}%`}
    </span>
  ) : (
    <span className="text-text-tertiary">{t('productsGroupAnalyticsNoHistory')}</span>
  )

  return (
    <div className="flex flex-col gap-8">
      <Card className="rounded-none border-none p-0 shadow-none hover:shadow-none">
        <CardHeader className="flex flex-col gap-3 p-0">
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
              options={channelOptions}
              value={activeChannel}
              onValueChange={setChannelFilter}
              searchPlaceholder={t('homeFilterChannelsSearch')}
              emptyLabel={t('homeFilterChannelsEmpty')}
              allowClear={false}
              triggerClassName="w-full sm:w-auto sm:min-w-[12rem]"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 p-0 pt-4">
          <div className="grid grid-cols-1 items-stretch gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              className="h-full"
              label={t('productsDetailPlatformPaymentNetSales')}
              value={insightsFetching ? kpiSkeleton : fmtCard(statement.total.net)}
              currencyCode={insightsFetching ? undefined : baseCurrency}
              showComparison={false}
              footerClassName="text-xs"
              footer={salesFooter}
            />
            <KpiCard
              className="h-full"
              label={t('productsDetailKpiNetUnitsSold')}
              value={
                insightsFetching ? kpiSkeleton : `${units.net.toLocaleString()} ${unitSuffix}`
              }
              showComparison={false}
              footerClassName="text-xs"
              footer={
                <span className="text-text-tertiary">
                  {fill(t('productsGroupAnalyticsUnitsBreakdown'), {
                    sold: units.sold.toLocaleString(),
                    returned: units.returned.toLocaleString(),
                  })}
                </span>
              }
            />
            <KpiCard
              className="h-full"
              label={t('productsGroupAnalyticsVelocity')}
              value={insightsFetching ? kpiSkeleton : velocityValue}
              showComparison={false}
              footerClassName="text-xs"
              footer={<PlatformDetail label={platformDetailLabel} lines={velocityLines} />}
            />
            <KpiCard
              className="h-full"
              label={t('productsDetailKpiInventoryDays')}
              value={insightsFetching ? kpiSkeleton : daysValue}
              showComparison={false}
              footerClassName="text-xs"
              footer={<PlatformDetail label={platformDetailLabel} lines={daysLines} />}
            />
          </div>
          <GroupWeeklyNetSalesChart
            rows={series?.months ?? []}
            start={insightStart}
            end={insightEnd}
            lang={lang}
            today={today}
            formatMoney={fmtBase}
            t={t}
            isLoading={seriesFetching && !series}
            isError={isError}
          />
        </CardContent>
      </Card>
      <GroupChannelCoverTable
        rows={coverRows}
        lang={lang}
        t={t}
        isFetching={insightsFetching}
      />
      <p className="mb-16 text-xs text-text-tertiary">{dataNote}</p>
    </div>
  )
}
