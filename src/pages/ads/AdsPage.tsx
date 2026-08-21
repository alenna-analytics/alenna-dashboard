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
import { presetDateRangeYmd } from '@/ui/date-range-picker'
import { FilterDates } from '@/ui/filters/filter-dates'
import { KpiCard } from '@/ui/kpi-card'
import { Skeleton } from '@/ui/skeleton'
import { useMemo } from 'react'

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
  const isLoading = queryEnabled && (kpis.isLoading || channels.isLoading || series.isLoading)
  const isError = kpis.isError || channels.isError || series.isError
  const formatDisplay = (n: number) =>
    formatMoney(n, adsCurrency ? { nativeCurrency: adsCurrency } : undefined)

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
              onStartChange={(v) => v && setFilters({ start: v, end: filters.end })}
              onEndChange={(v) => v && setFilters({ start: filters.start, end: v })}
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
          error={kpis.error ?? channels.error ?? series.error}
          isRetrying={kpis.isFetching || channels.isFetching || series.isFetching}
          onRetry={() => {
            void kpis.refetch()
            void channels.refetch()
            void series.refetch()
          }}
        />
      ) : (
        <>
          <SectionContainer>
            <SectionHeader title={shellT(lang, 'adsKpiSectionTitle')} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <AdsSummaryKpi
                label={shellT(lang, 'adsKpiSpend')}
                value={data ? formatDisplay(data.spend) : '—'}
                loading={isLoading}
                currencyCode={adsCurrency}
              />
              <AdsSummaryKpi
                label={shellT(lang, 'adsKpiSales')}
                value={data ? formatDisplay(data.attributed_sales) : '—'}
                loading={isLoading}
                currencyCode={adsCurrency}
              />
              <AdsSummaryKpi
                label={shellT(lang, 'adsKpiRoas')}
                value={data ? formatRatio(data.roas) : '—'}
                loading={isLoading}
              />
              <AdsSummaryKpi
                label={shellT(lang, 'adsKpiBreakEvenRoas')}
                value={data ? formatRatio(data.break_even_roas) : '—'}
                loading={isLoading}
              />
              <AdsSummaryKpi
                label={shellT(lang, 'adsKpiTacos')}
                value={data ? (data.case_c ? '—' : formatRatio(data.tacos)) : '—'}
                loading={isLoading}
              />
              <AdsSummaryKpi
                label={shellT(lang, 'adsKpiCpa')}
                value={data ? formatRatio(data.cpa) : '—'}
                loading={isLoading}
              />
            </div>
          </SectionContainer>

          <div className="grid gap-12 lg:grid-cols-2">
            <SectionContainer>
              <SectionHeader title={shellT(lang, 'adsChartTrendTitle')} />
              <AdsTrendChart
                points={series.data?.points ?? []}
                lang={lang}
                formatValue={formatDisplay}
                isLoading={isLoading}
              />
            </SectionContainer>
            <SectionContainer>
              <SectionHeader title={shellT(lang, 'adsChartChannelTitle')} />
              <AdsChannelSpendChart
                rows={channels.data?.items ?? []}
                lang={lang}
                formatValue={formatDisplay}
                isLoading={isLoading}
              />
            </SectionContainer>
          </div>

          <SectionContainer>
            <SectionHeader title={shellT(lang, 'adsChannelTableTitle')} />
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
                  {(channels.data?.items ?? []).map((row) => (
                    <tr
                      key={`${row.platform}-${row.connection_id ?? 'none'}`}
                      className="border-t border-border-subtle"
                    >
                      <td className="px-3 py-2">{adsPlatformLabel(row.platform, lang)}</td>
                      <td className="px-3 py-2">{formatDisplay(row.spend)}</td>
                      <td className="px-3 py-2">{formatDisplay(row.attributed_sales)}</td>
                      <td className="px-3 py-2">{formatRatio(row.roas)}</td>
                      <td className="px-3 py-2">{formatRatio(row.tacos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionContainer>
        </>
      )}
    </DashboardPage>
  )
}
