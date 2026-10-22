import { useMemo, type ReactNode } from 'react'

import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkGroupApi } from '@/lib/types/product-links'
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
import { KpiCard } from '@/ui/kpi-card'
import { Skeleton } from '@/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

import {
  connectionIdsForPlatform,
} from '../product-detail-analytics-filter'
import { productPlatformLabel } from '../product-platform-label'
import { buildChannelCoverRows } from './group-channel-cover'
import { GroupChannelCoverTable } from './group-channel-cover-table'
import { formatInsightRange } from './group-weekly-sales'
import { GroupWeeklyNetSalesChart } from './group-weekly-net-sales-chart'
import { useGroupInsight } from './use-group-insight'
import { useProductLinkGroupQuery } from './use-product-link-queries'
import {
  filterGroupPeriod,
  selectFilteredGroupMembers,
} from './group-insight-dimension'

type ShellT = (key: ShellStringKey) => string

type VinculacionGroupAnalyticsProps = {
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

export function VinculacionGroupAnalytics({
  group,
  lang,
  t,
  baseCurrency,
  fmtBase,
  fmtCard,
  insightStart,
  insightEnd,
  setInsightStart,
  setInsightEnd,
  pickerStrings,
  insightsFetching,
}: VinculacionGroupAnalyticsProps) {
  const insight = useGroupInsight()
  const { me } = useWorkspace()
  const connectionsQuery = usePlatformConnectionsQuery()
  const today = useMemo(() => new Date(), [])
  const kpiSkeleton = <Skeleton className="mt-0.5 h-6 w-24 max-w-full" aria-hidden />

  const channelSelection = useMemo(
    () =>
      selectFilteredGroupMembers(group, {
        dimension: 'channel',
        channelFilter: insight.channelFilter,
        productFilter: insight.productFilter,
      }),
    [group, insight.channelFilter, insight.productFilter],
  )
  const filteredMembers = channelSelection.members
  const allSelected = channelSelection.allSelected
  const period = useMemo(
    () => filterGroupPeriod(group, filteredMembers, allSelected),
    [allSelected, filteredMembers, group],
  )
  const chartProductIds = useMemo(
    () => filteredMembers.map((member) => member.product_id),
    [filteredMembers],
  )
  const chartConnectionIds = useMemo(
    () => connectionIdsForPlatform(connectionsQuery.data, insight.channelFilter),
    [connectionsQuery.data, insight.channelFilter],
  )

  const coverRows = useMemo(
    () => buildChannelCoverRows(group, filteredMembers, today),
    [filteredMembers, group, today],
  )
  const channelRows = coverRows.filter((row) => !row.isTotal)
  const totalRow = coverRows.find((row) => row.isTotal)

  const units = useMemo(() => {
    if (allSelected) {
      const sold = group.period_gross_units_sold
      const net = group.period_net_units_sold
      return { net, sold, returned: Math.max(0, sold - net) }
    }
    const sold = filteredMembers.reduce((sum, member) => sum + member.period_gross_units_sold, 0)
    const net = filteredMembers.reduce((sum, member) => sum + member.period_net_units_sold, 0)
    return { net, sold, returned: Math.max(0, sold - net) }
  }, [allSelected, filteredMembers, group.period_gross_units_sold, group.period_net_units_sold])

  const kpiPrevPeriod = useMemo(
    () => computeShiftedPreviousPeriod(insightStart, insightEnd),
    [insightEnd, insightStart],
  )

  const { data: series, isError, isFetching: seriesFetching } = useMonthlyRevenueSeries({
    productIds: chartProductIds,
    connectionIds: chartConnectionIds,
    startDate: insightStart,
    endDate: insightEnd,
    granularity: 'week',
    enabled: chartProductIds.length > 0 && Boolean(insightStart && insightEnd),
  })

  const prevGroupQuery = useProductLinkGroupQuery(
    kpiPrevPeriod ? group.id : undefined,
    kpiPrevPeriod?.start ?? '',
    kpiPrevPeriod?.end ?? '',
  )

  const filteredPrevNetSales = useMemo(() => {
    const prevGroup = prevGroupQuery.data
    if (!prevGroup) return null
    const { members, allSelected: prevAll } = selectFilteredGroupMembers(prevGroup, {
      dimension: 'channel',
      channelFilter: insight.channelFilter,
      productFilter: insight.productFilter,
    })
    if (prevAll) return prevGroup.period_net_sales
    return members.reduce((sum, member) => sum + member.period_net_sales, 0)
  }, [
    insight.channelFilter,
    insight.productFilter,
    prevGroupQuery.data,
  ])

  const previousReady = Boolean(kpiPrevPeriod) && !prevGroupQuery.isLoading
  const comparableHistory = historyIsComparable({
    previousValue: filteredPrevNetSales,
    firstActivity: group.first_order_date,
    previousStart: kpiPrevPeriod?.start,
  })
  const salesDelta =
    previousReady && comparableHistory && filteredPrevNetSales != null
      ? pctVersusPrevious(period.period_net_sales, filteredPrevNetSales)
      : null

  const velocityLabel = t('productsGroupAnalyticsVelocity')
  const daysLabel = t('productsDetailKpiInventoryDays')
  const unitSuffix = t('productsGroupAnalyticsUnitSuffix')
  const perDay = t('productsDetailInventoryVelocityUnit')
  const daysSuffix = t('productsDetailKpiInventoryDaysSuffix')
  const platformDetailLabel = t('productsGroupAnalyticsPlatformDetail')

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
              onStartChange={(v) => v && setInsightStart(v)}
              onEndChange={(v) => v && setInsightEnd(v)}
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
        </CardHeader>
        <CardContent className="flex flex-col gap-6 p-0 pt-4">
          <div className="grid grid-cols-1 items-stretch gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              className="h-full"
              label={t('productsDetailPlatformPaymentNetSales')}
              value={insightsFetching ? kpiSkeleton : fmtCard(period.period_net_sales)}
              currencyCode={insightsFetching ? undefined : baseCurrency}
              showComparison={false}
              footerClassName="text-xs"
              footer={salesFooter}
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
              label={velocityLabel}
              value={insightsFetching ? kpiSkeleton : velocityValue}
              showComparison={false}
              footerClassName="text-xs"
              footer={
                <PlatformDetail label={platformDetailLabel} lines={velocityLines} />
              }
            />
            <KpiCard
              className="h-full"
              label={daysLabel}
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
        group={group}
        members={filteredMembers}
        lang={lang}
        t={t}
        today={today}
        isFetching={insightsFetching}
      />
      <p className="mb-16 text-xs text-text-tertiary">{dataNote}</p>
    </div>
  )
}
