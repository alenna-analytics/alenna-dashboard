import { useCallback, useMemo, useState } from 'react'

import { AlertTriangle, BarChart3, type LucideIcon } from 'lucide-react'

import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { enUS, es as esLocale } from 'date-fns/locale'

import { useCurrentTenant } from '@/auth/hooks'
import { useMoney } from '@/hooks/use-money'
import { apiFetch } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
import type { PlatformConnection } from '@/lib/types/connectors'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'
import { ChannelsCmChart } from '@/pages/channels/channels-cm-chart'
import { ChannelsCostStructureChart } from '@/pages/channels/channels-cost-structure-chart'
import { ChannelsPnlTable } from '@/pages/channels/channels-pnl-table'
import { ChannelsSettlementTable } from '@/pages/channels/channels-settlement-table'
import {
  aggregateChannelKpisByPlatform,
  aggregateChannelSettlementByPlatform,
  buildScoreboardRows,
  type ChannelPlatform,
} from '@/pages/channels/channels-platform-aggregate'
import { ChannelsScoreboard } from '@/pages/channels/channels-scoreboard'
import { useChannelsPageFilters } from '@/pages/channels/use-channels-page-filters'
import { includesAmazonWithUnavailableFees } from '@/lib/integrations/amazon-fees-notice'
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { HomeNoIntegrationsState } from '@/pages/dashboard/home-no-integrations-state'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { computeShiftedPreviousPeriod } from '@/pages/reports/reports-ui-helpers'
import { useChannelTimeSeries } from '@/pages/reports/use-channel-time-series'
import { useKpisByChannel } from '@/pages/reports/use-kpis-by-channel'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { FilterComboboxMulti } from '@/ui/filters/filter-combobox-multi'
import { FilterDates } from '@/ui/filters/filter-dates'
import { ContextAlertCard, ContextAlertsGroup, type ContextAlertTone } from '@/ui/context-alert'
import { Skeleton } from '@/ui/skeleton'
import { cn } from '@/lib/utils'

function platformDisplayName(platform: string): string {
  const trimmed = platform.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function ChannelsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-12">
      <SectionContainer>
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="h-64 w-full rounded-md" />
      </SectionContainer>
      <SectionContainer>
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="h-80 w-full rounded-md" />
      </SectionContainer>
      <SectionContainer>
        <Skeleton className="mb-4 h-6 w-56" />
        <Skeleton className="h-80 w-full rounded-md" />
      </SectionContainer>
    </div>
  )
}

export function ChannelsPage() {
  const { lang } = useLanguage()
  const dateLocale = lang === 'en' ? enUS : esLocale
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const t = useCallback(
    (k: Parameters<typeof shellT>[1]) => shellT(lang, k),
    [lang],
  )

  const [filters, setFilters] = useChannelsPageFilters(tenantId)
  const { startDate, endDate, connectionIds } = filters
  const [cmGranularity, setCmGranularity] = useState<RevenueSeriesGranularity>('month')

  const connectionsQuery = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as PlatformConnection[]
    },
  })

  const connections = useMemo(
    () =>
      (connectionsQuery.data ?? []).filter(
        (connection) =>
          connection.status === 'active' &&
          connection.connection_status === 'active',
      ),
    [connectionsQuery.data],
  )
  const connectorsLoading = Boolean(tenantId) && connectionsQuery.isLoading
  const hasNoIntegrations =
    !connectorsLoading && connectionsQuery.isSuccess && connections.length === 0

  const activeConnectionIds = useMemo(() => {
    if (connections.length === 0) return [] as string[]
    if (connectionIds.length === 0) return connections.map((c) => c.id)
    const valid = new Set(connections.map((c) => c.id))
    const filtered = connectionIds.filter((id) => valid.has(id))
    return filtered.length > 0 ? filtered : connections.map((c) => c.id)
  }, [connections, connectionIds])

  const channelOptions = useMemo(
    () =>
      connections.map((c) => ({
        value: c.id,
        label: platformDisplayName(c.platform),
      })),
    [connections],
  )

  const displayedPlatforms = useMemo((): ChannelPlatform[] => {
    const selectedIds = new Set(activeConnectionIds)
    const seen = new Set<string>()
    const platforms: ChannelPlatform[] = []
    for (const connection of connections) {
      if (!selectedIds.has(connection.id)) continue
      const slug = connection.platform.trim().toLowerCase()
      if (!slug || seen.has(slug)) continue
      seen.add(slug)
      platforms.push({
        slug,
        label:
          slug === 'mercadolibre'
            ? t('channelsColMercadoLibre')
            : platformDisplayName(connection.platform),
      })
    }
    return platforms
  }, [activeConnectionIds, connections, t])

  const queriesEnabled = activeConnectionIds.length > 0
  const prevPeriod = useMemo(
    () => computeShiftedPreviousPeriod(startDate, endDate),
    [startDate, endDate],
  )

  const {
    data: kpis,
    isLoading: kpisLoading,
    isSuccess: kpisReady,
  } = useKpisByChannel({
    connectionIds: activeConnectionIds,
    startDate,
    endDate,
    enabled: queriesEnabled,
  })

  const { data: kpisPrev } = useKpisByChannel({
    connectionIds: activeConnectionIds,
    startDate: prevPeriod?.start ?? '',
    endDate: prevPeriod?.end ?? '',
    enabled: queriesEnabled && Boolean(prevPeriod) && kpisReady,
  })

  const {
    data: channelTimeSeries,
    isError: channelTimeSeriesError,
    isLoading: channelTimeSeriesLoading,
  } = useChannelTimeSeries({
    connectionIds: activeConnectionIds,
    startDate,
    endDate,
    granularity: cmGranularity,
    enabled: queriesEnabled,
  })

  const { format: formatMoney, convert: convertMoney, effectiveDisplayCurrency, baseCurrency } =
    useMoney()
  const currency = kpis?.currency ?? baseCurrency

  const convertFromBase = useMemo(
    () => (n: number) => convertMoney(n, { nativeCurrency: currency }).amount,
    [convertMoney, currency],
  )
  const formatConverted = useMemo(
    () => (n: number) =>
      formatMoney(convertFromBase(n), { nativeCurrency: effectiveDisplayCurrency }),
    [formatMoney, convertFromBase, effectiveDisplayCurrency],
  )
  const formatInDisplay = useMemo(
    () => (n: number) => formatMoney(n, { nativeCurrency: effectiveDisplayCurrency }),
    [formatMoney, effectiveDisplayCurrency],
  )

  const currentAgg = useMemo(() => {
    const agg = aggregateChannelKpisByPlatform(kpis?.items ?? [], displayedPlatforms)
    agg.total.ads_spend = Number(kpis?.tenant_ads_spend ?? 0)
    return agg
  }, [kpis, displayedPlatforms])
  const settlementAgg = useMemo(
    () => aggregateChannelSettlementByPlatform(kpis?.items ?? [], displayedPlatforms),
    [kpis, displayedPlatforms],
  )
  const previousAgg = useMemo(() => {
    if (!kpisPrev) return null
    const agg = aggregateChannelKpisByPlatform(kpisPrev.items, displayedPlatforms)
    agg.total.ads_spend = Number(kpisPrev.tenant_ads_spend ?? 0)
    return agg
  }, [kpisPrev, displayedPlatforms])
  const scoreboardRows = useMemo(
    () => buildScoreboardRows(currentAgg, previousAgg, displayedPlatforms),
    [currentAgg, previousAgg, displayedPlatforms],
  )
  const cmIncomplete = Boolean(kpis?.cm_incomplete)
  const showAmazonFeesNotice = includesAmazonWithUnavailableFees(
    connections,
    activeConnectionIds,
  )

  const pageAlerts = useMemo(() => {
    type PageAlertItem = {
      key: string
      title: string
      icon: LucideIcon
      tone: ContextAlertTone
    }
    const items: PageAlertItem[] = []
    if (showAmazonFeesNotice) {
      items.push({
        key: 'amazon-fees',
        title: t('integrationAmazonFeesUnavailableBanner'),
        icon: AlertTriangle,
        tone: 'warning',
      })
    }
    if (cmIncomplete) {
      items.push({
        key: 'cm-incomplete',
        title: t('channelsCmIncompleteNotice'),
        icon: BarChart3,
        tone: 'warning',
      })
    }
    return items
  }, [showAmazonFeesNotice, cmIncomplete, t])

  const isInitialLoad =
    connectorsLoading || (queriesEnabled && kpisLoading && !kpis)

  const pickerStrings = {
    applyLabel: t('datePickerApply'),
    todayLabel: t('datePickerToday'),
    placeholder: t('datePickerPlaceholder'),
    presetLast7Days: t('datePickerLast7Days'),
    presetLast30Days: t('datePickerLast30Days'),
    presetLast3Months: t('datePickerLast3Months'),
    presetLast6Months: t('datePickerLast6Months'),
    presetLastYearRolling: t('datePickerLastYearRolling'),
    presetCurrentYear: t('datePickerCurrentYear'),
    presetPreviousYear: t('datePickerPreviousYear'),
  }

  return (
    <DashboardPage className={cn('flex flex-1 flex-col', hasNoIntegrations ? 'gap-0' : 'gap-8')}>
      {!hasNoIntegrations ? (
        <header className="flex flex-col gap-4">
          <div className="min-w-0">
            <h1 className="text-title font-semibold tracking-[-0.02em] text-text-primary">
              {t('channelsPageTitle')}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary">
              {t('channelsPageSubtitle')}
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2">
            <FilterDates
              strings={pickerStrings}
              startValue={startDate}
              endValue={endDate}
              onStartChange={(v) => v && setFilters({ startDate: v })}
              onEndChange={(v) => v && setFilters({ endDate: v })}
            />
            <FilterComboboxMulti
              label={t('homeFilterChannels')}
              options={channelOptions}
              values={connectionIds}
              onValuesChange={(next) => setFilters({ connectionIds: next })}
              searchPlaceholder={t('homeFilterChannelsSearch')}
              emptyLabel={t('homeFilterChannelsEmpty')}
              clearAriaLabel={t('filterClear')}
              selectAllLabel={t('homeFilterSelectAll')}
              deselectAllLabel={t('homeFilterDeselectAll')}
            />
          </div>
        </header>
      ) : null}

      {hasNoIntegrations ? (
        <HomeNoIntegrationsState lang={lang} />
      ) : isInitialLoad ? (
        <ChannelsLoadingSkeleton />
      ) : !queriesEnabled ? (
        <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
          {t('reportsSelectConnection')}
        </p>
      ) : (
        <div className="flex flex-col gap-12">
          {pageAlerts.length > 0 ? (
            <ContextAlertsGroup
              title={t('contextAlertsTitle').replace('{count}', String(pageAlerts.length))}
            >
              {pageAlerts.map((alert) => (
                <ContextAlertCard
                  key={alert.key}
                  title={alert.title}
                  icon={alert.icon}
                  tone={alert.tone}
                />
              ))}
            </ContextAlertsGroup>
          ) : null}
          <ChannelsScoreboard
            rows={scoreboardRows}
            platforms={displayedPlatforms}
            formatMoney={formatConverted}
            t={t}
            cmIncomplete={cmIncomplete}
          />

          <ChannelsPnlTable
            metrics={currentAgg}
            platforms={displayedPlatforms}
            formatMoney={formatConverted}
            t={t}
            cmIncomplete={cmIncomplete}
          />

          <ChannelsSettlementTable
            metrics={settlementAgg}
            platforms={displayedPlatforms}
            formatMoney={formatConverted}
            t={t}
          />

          <SectionContainer>
            <SectionHeader
              title={
                cmIncomplete
                  ? t('channelsCmChartTitleProductScope')
                  : t('channelsCmChartTitle')
              }
              description={
                cmIncomplete
                  ? t('channelsCmChartSubtitleProductScope')
                  : t('channelsCmChartSubtitle')
              }
              aside={
                <ChartGranularityFilter
                  value={cmGranularity}
                  onChange={setCmGranularity}
                  t={t}
                />
              }
            />
            {channelTimeSeriesError ? (
              <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
                {t('reportsMonthlyLoadError')}
              </p>
            ) : channelTimeSeriesLoading && !channelTimeSeries ? (
              <Skeleton className="h-80 w-full rounded-md" />
            ) : (
              <ChannelsCmChart
                startDate={startDate}
                endDate={endDate}
                granularity={cmGranularity}
                rows={channelTimeSeries?.rows ?? []}
                formatValue={formatInDisplay}
                convertValue={convertFromBase}
                dateLocale={dateLocale}
                platforms={displayedPlatforms}
                t={t}
                cmIncomplete={cmIncomplete}
              />
            )}
          </SectionContainer>

          <SectionContainer>
            <SectionHeader
              title={t('channelsCostStructureTitle')}
              description={t('channelsCostStructureSubtitle')}
            />
            <ChannelsCostStructureChart
              metrics={currentAgg}
              platforms={displayedPlatforms}
              t={t}
            />
          </SectionContainer>
        </div>
      )}
    </DashboardPage>
  )
}
