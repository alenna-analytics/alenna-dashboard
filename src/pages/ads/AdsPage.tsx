import { useMemo } from 'react'
import { AlertTriangle, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useCurrentTenant } from '@/auth/hooks'
import { useMoney } from '@/hooks/use-money'
import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { resolveAdsApiScope } from '@/lib/integrations/ads-scope'
import { shellT } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import { cn } from '@/lib/utils'
import { AdsChannelSpendChart } from '@/pages/ads/ads-channel-spend-chart'
import { adsPlatformLabel } from '@/pages/ads/ads-platform-label'
import { AdsTrendChart } from '@/pages/ads/ads-trend-chart'
import { useAdsChannels, useAdsKpis, useAdsSeries } from '@/pages/ads/use-ads-kpis'
import { IntegrationsErrorState } from '@/pages/integrations/dashboard/integrations-error-state'
import { useIntegrationsListQueries } from '@/pages/integrations/hooks/use-integrations-list-queries'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { DashboardPage, pageSubtitleClassName, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { buttonVariants } from '@/ui/button'
import { ContextAlertCard, ContextAlertsGroup, type ContextAlertTone } from '@/ui/context-alert'
import { presetDateRangeYmd } from '@/ui/date-range-picker'
import { EmptyState } from '@/ui/empty-state'
import { FilterDates } from '@/ui/filters/filter-dates'
import { KpiCard } from '@/ui/kpi-card'
import { Skeleton } from '@/ui/skeleton'

type AdsFiltersState = {
  start: string
  end: string
}

function parseAdsFilters(raw: unknown): AdsFiltersState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.start !== 'string' || typeof o.end !== 'string') return null
  return { start: o.start, end: o.end }
}

function formatRatio(value: number | null): string {
  if (value == null) return '—'
  return value.toFixed(2)
}

function formatTacosPct(value: number | null): string {
  if (value == null) return '—'
  return `${(value * 100).toFixed(2)}%`
}

function AdsSummaryKpi({
  label,
  value,
  helpText,
  loading,
  currencyCode,
}: {
  label: string
  value: string
  helpText?: string
  loading: boolean
  currencyCode?: string
}) {
  if (loading) {
    return (
      <div className="rounded-md border border-border-default bg-bg-card-strong p-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-7 w-36" />
      </div>
    )
  }

  return (
    <KpiCard
      label={label}
      helpText={helpText}
      value={value}
      currencyCode={currencyCode}
      vsPriorLabel=""
      priorValueDisplay={null}
      pct={null}
      trend="flat"
      comparisonUnavailable
      showComparison={false}
      valueClassName="text-text-primary"
    />
  )
}

export function AdsPage() {
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const { tenantId } = useCurrentTenant()
  const { format: formatMoney } = useMoney()
  const { connections } = useIntegrationsListQueries()
  const defaultRange = presetDateRangeYmd('last30')
  const [filters, setFilters] = useTenantPersistedJson<AdsFiltersState>(
    tenantId,
    'ads-filters',
    { start: defaultRange.start, end: defaultRange.end },
    parseAdsFilters,
  )
  const pickerStrings = {
    applyLabel: shellT(lang, 'datePickerApply'),
    todayLabel: shellT(lang, 'datePickerToday'),
    placeholder: shellT(lang, 'datePickerPlaceholder'),
    presetLast7Days: shellT(lang, 'datePickerLast7Days'),
    presetLast30Days: shellT(lang, 'datePickerLast30Days'),
    presetLast3Months: shellT(lang, 'datePickerLast3Months'),
    presetLast6Months: shellT(lang, 'datePickerLast6Months'),
    presetLastYearRolling: shellT(lang, 'datePickerLastYearRolling'),
    presetCurrentYear: shellT(lang, 'datePickerCurrentYear'),
    presetPreviousYear: shellT(lang, 'datePickerPreviousYear'),
  }

  const adsScope = useMemo(() => resolveAdsApiScope(connections), [connections])
  const canView = can(me, 'ads.view')
  const queryEnabled = adsScope.hasAdsConnections && canView

  const kpis = useAdsKpis({
    connectionIds: adsScope.queryConnectionIds,
    startDate: filters.start,
    endDate: filters.end,
    enabled: queryEnabled,
  })
  const channels = useAdsChannels({
    connectionIds: adsScope.queryConnectionIds,
    startDate: filters.start,
    endDate: filters.end,
    enabled: queryEnabled,
  })
  const series = useAdsSeries({
    connectionIds: adsScope.queryConnectionIds,
    startDate: filters.start,
    endDate: filters.end,
    enabled: queryEnabled,
  })

  const data = kpis.data
  const adsCurrency = channels.data?.currency ?? series.data?.currency ?? data?.currency
  const kpisChannelsLoading = queryEnabled && (kpis.isLoading || channels.isLoading)
  const isError = kpis.isError || channels.isError
  const channelItems = channels.data?.items ?? []
  const formatDisplay = (n: number) =>
    formatMoney(n, adsCurrency ? { nativeCurrency: adsCurrency } : undefined)

  const pageAlerts = useMemo(() => {
    type PageAlertItem = {
      key: string
      title: string
      icon: LucideIcon
      tone: ContextAlertTone
    }
    const items: PageAlertItem[] = []
    const fxIncomplete =
      Boolean(kpis.data?.fx_incomplete) ||
      Boolean(channels.data?.items.some((row) => row.fx_incomplete)) ||
      Boolean(series.data?.fx_incomplete)
    if (fxIncomplete) {
      items.push({
        key: 'fx-incomplete',
        title: shellT(lang, 'adsFxIncompleteWarning'),
        icon: AlertTriangle,
        tone: 'warning',
      })
    }
    return items
  }, [kpis.data?.fx_incomplete, channels.data?.items, series.data?.fx_incomplete, lang])

  return (
    <DashboardPage className="flex flex-1 flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="min-w-0">
          <h1 className={pageTitleClassName}>{shellT(lang, 'navAds')}</h1>
          <p className={cn('mt-1', pageSubtitleClassName)}>
            {adsScope.hasAdsConnections
              ? shellT(lang, 'adsPageSubtitle')
              : shellT(lang, 'adsEmptyState')}
          </p>
        </div>
        {adsScope.hasAdsConnections ? (
          <div className="flex w-full flex-wrap items-center gap-2">
            <FilterDates
              strings={pickerStrings}
              startValue={filters.start}
              endValue={filters.end}
              onStartChange={(v) => v && setFilters({ start: v })}
              onEndChange={(v) => v && setFilters({ end: v })}
            />
          </div>
        ) : null}
      </header>

      {!adsScope.hasAdsConnections ? (
        <div className="rounded-md border border-border-subtle p-6">
          <p className="text-sm text-text-secondary">{shellT(lang, 'adsEmptyState')}</p>
          <Link
            to="/dashboard/integrations/ads"
            className={`${buttonVariants({ variant: 'accent', size: 'tiny' })} mt-4`}
          >
            {shellT(lang, 'adsGoIntegrations')}
          </Link>
        </div>
      ) : isError ? (
        <IntegrationsErrorState
          lang={lang}
          error={kpis.error ?? channels.error}
          isRetrying={kpis.isFetching || channels.isFetching}
          onRetry={() => {
            void kpis.refetch()
            void channels.refetch()
            void series.refetch()
          }}
        />
      ) : (
        <>
          {pageAlerts.length > 0 ? (
            <ContextAlertsGroup
              title={shellT(lang, 'contextAlertsTitle').replace(
                '{count}',
                String(pageAlerts.length),
              )}
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

          <SectionContainer>
            <SectionHeader title={shellT(lang, 'adsKpiSectionTitle')} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <AdsSummaryKpi
                label={shellT(lang, 'adsKpiSpend')}
                helpText={shellT(lang, 'adsKpiHelpSpend')}
                value={data ? formatDisplay(data.spend) : '—'}
                loading={kpisChannelsLoading}
                currencyCode={adsCurrency}
              />
              <AdsSummaryKpi
                label={shellT(lang, 'adsKpiSales')}
                helpText={shellT(lang, 'adsKpiHelpSales')}
                value={data ? formatDisplay(data.attributed_sales) : '—'}
                loading={kpisChannelsLoading}
                currencyCode={adsCurrency}
              />
              <AdsSummaryKpi
                label={shellT(lang, 'adsKpiRoas')}
                helpText={shellT(lang, 'adsKpiHelpRoas')}
                value={data ? formatRatio(data.roas) : '—'}
                loading={kpisChannelsLoading}
              />
              <AdsSummaryKpi
                label={shellT(lang, 'adsKpiBreakEvenRoas')}
                helpText={shellT(lang, 'adsKpiHelpBreakEvenRoas')}
                value={data ? formatRatio(data.break_even_roas) : '—'}
                loading={kpisChannelsLoading}
              />
              <AdsSummaryKpi
                label={shellT(lang, 'adsKpiTacos')}
                helpText={shellT(lang, 'adsKpiHelpTacos')}
                value={data ? (data.case_c ? '—' : formatTacosPct(data.tacos)) : '—'}
                loading={kpisChannelsLoading}
              />
              <AdsSummaryKpi
                label={shellT(lang, 'adsKpiCpa')}
                helpText={shellT(lang, 'adsKpiHelpCpa')}
                value={data ? formatRatio(data.cpa) : '—'}
                loading={kpisChannelsLoading}
              />
            </div>
          </SectionContainer>

          <div className="grid gap-12 lg:grid-cols-2">
            <SectionContainer>
              <SectionHeader title={shellT(lang, 'adsChartTrendTitle')} />
              <AdsTrendChart
                points={series.isError ? [] : (series.data?.points ?? [])}
                lang={lang}
                formatValue={formatDisplay}
                isLoading={queryEnabled && series.isLoading}
              />
            </SectionContainer>
            <SectionContainer>
              <SectionHeader title={shellT(lang, 'adsChartChannelTitle')} />
              <AdsChannelSpendChart
                rows={channelItems}
                lang={lang}
                formatValue={formatDisplay}
                isLoading={kpisChannelsLoading}
              />
            </SectionContainer>
          </div>

          <SectionContainer>
            <SectionHeader title={shellT(lang, 'adsChannelTableTitle')} />
            {kpisChannelsLoading ? (
              <Skeleton className="h-40 w-full rounded-md" aria-hidden />
            ) : channelItems.length === 0 ? (
              <EmptyState size="sm" icon="home" title={shellT(lang, 'adsChannelTableEmpty')} />
            ) : (
              <div className="overflow-x-auto rounded-md border border-border-subtle">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-muted/40 text-text-secondary">
                    <tr>
                      <th className="px-3 py-2 font-medium">{shellT(lang, 'adsChannelColumn')}</th>
                      <th className="px-3 py-2 font-medium">{shellT(lang, 'adsKpiSpend')}</th>
                      <th className="px-3 py-2 font-medium">{shellT(lang, 'adsKpiSales')}</th>
                      <th className="px-3 py-2 font-medium">{shellT(lang, 'adsKpiRoas')}</th>
                      <th className="px-3 py-2 font-medium">{shellT(lang, 'adsKpiTacos')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelItems.map((row) => (
                      <tr
                        key={`${row.platform}-${row.connection_id ?? 'none'}`}
                        className="border-t border-border-subtle"
                      >
                        <td className="px-3 py-2">{adsPlatformLabel(row.platform, lang)}</td>
                        <td className="px-3 py-2">{formatDisplay(row.spend)}</td>
                        <td className="px-3 py-2">{formatDisplay(row.attributed_sales)}</td>
                        <td className="px-3 py-2">{formatRatio(row.roas)}</td>
                        <td className="px-3 py-2">{formatTacosPct(row.tacos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionContainer>
        </>
      )}
    </DashboardPage>
  )
}
