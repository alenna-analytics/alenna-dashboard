import { useMemo, useState } from 'react'

import { AlertTriangle, BarChart3, type LucideIcon } from 'lucide-react'

import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { filterEcommerceConnections, resolveAdsApiScope } from '@/lib/integrations/ads-scope'
import type { PlatformConnection } from '@/lib/types/connectors'
import { useAdsChannels } from '@/pages/ads/use-ads-kpis'
import { aggregateAdsByEcommercePlatform } from '@/pages/channels/channels-ads-by-platform'
import { alignChannelPnl } from '@/pages/channels/channels-pnl-align'
import { ChannelsCostStructureChart } from '@/pages/channels/channels-cost-structure-chart'
import { ChannelsPnlTable } from '@/pages/channels/channels-pnl-table'
import { usePnlAwareT, usePnlLabelResolver } from '@/pages/configuration/pnl-terms/use-pnl-labels-queries'
import { ChannelsSettlementTable } from '@/pages/channels/channels-settlement-table'
import {
  aggregateChannelKpisByPlatform,
  aggregateChannelSettlementByPlatform,
  type ChannelPlatform,
} from '@/pages/channels/channels-platform-aggregate'
import { useChannelsPageFilters } from '@/pages/channels/use-channels-page-filters'
import { useTaxRatesQuery } from '@/pages/configuration/tax-rates/use-tax-rates-queries'
import {
  estimateSettlementTaxByPlatform,
  settlementWithEstimatedTax,
} from '@/pages/products/product-pnl-tax-estimates'
import { formatInsightRange } from '@/pages/products/vinculacion/group-weekly-sales'
import { HomeNoIntegrationsState } from '@/pages/dashboard/home-no-integrations-state'
import { ChartSectionHeader, SectionContainer } from '@/pages/reports/report-ui'
import { useKpisByChannel } from '@/pages/reports/use-kpis-by-channel'
import { useReports } from '@/pages/reports/use-reports'
import { DashboardPage, pageSubtitleClassName, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { FilterComboboxMulti } from '@/ui/filters/filter-combobox-multi'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import { FilterDates } from '@/ui/filters/filter-dates'
import { dateRangePickerStrings } from '@/ui/date-range-picker'
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
        <Skeleton className="h-80 w-full rounded-md" />
      </SectionContainer>
      <SectionContainer>
        <Skeleton className="mb-4 h-6 w-64" />
        <Skeleton className="h-40 w-full rounded-md" />
      </SectionContainer>
    </div>
  )
}

export function ChannelsPage() {
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const t = usePnlAwareT()
  const labelForRow = usePnlLabelResolver()

  const [filters, setFilters] = useChannelsPageFilters(tenantId)
  const { startDate, endDate, connectionIds } = filters
  const [vista, setVista] = useState<'pnl' | 'cobro'>('pnl')
  const [amountBasis, setAmountBasis] = useState<'money' | 'pct'>('money')

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
      filterEcommerceConnections(connectionsQuery.data ?? []).filter(
        (connection) =>
          connection.status === 'active' &&
          connection.connection_status === 'active',
      ),
    [connectionsQuery.data],
  )
  const allConnections = useMemo(
    () => connectionsQuery.data ?? [],
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

  const {
    data: kpis,
    isLoading: kpisLoading,
  } = useKpisByChannel({
    connectionIds: activeConnectionIds,
    startDate,
    endDate,
    enabled: queriesEnabled,
  })

  const settlementAgg = useMemo(
    () => aggregateChannelSettlementByPlatform(kpis?.items ?? [], displayedPlatforms),
    [kpis, displayedPlatforms],
  )
  const cmIncomplete = Boolean(kpis?.cm_incomplete)

  const adsScope = useMemo(
    () => resolveAdsApiScope(allConnections, activeConnectionIds),
    [allConnections, activeConnectionIds],
  )
  const { data: adsChannels } = useAdsChannels({
    connectionIds: adsScope.queryConnectionIds,
    startDate,
    endDate,
    enabled: queriesEnabled && adsScope.hasAdsConnections,
  })

  const connectionIdToPlatform = useMemo(() => {
    const map: Record<string, string> = {}
    for (const connection of connections) {
      map[connection.id] = connection.platform.trim().toLowerCase()
    }
    return map
  }, [connections])

  const adsByPlatform = useMemo(
    () =>
      aggregateAdsByEcommercePlatform(
        adsChannels?.items ?? [],
        connectionIdToPlatform,
        displayedPlatforms,
      ),
    [adsChannels?.items, connectionIdToPlatform, displayedPlatforms],
  )

  const tenantAdsSpend = Number(kpis?.tenant_ads_spend ?? 0)
  const reportsKpis = useReports({
    connectionIds: activeConnectionIds,
    startDate,
    endDate,
    enabled: queriesEnabled,
  })
  const { data: taxRatesResponse } = useTaxRatesQuery()
  const taxRates = taxRatesResponse?.settings ?? null
  const alignedPnl = useMemo(() => {
    const metrics = aggregateChannelKpisByPlatform(kpis?.items ?? [], displayedPlatforms)
    return alignChannelPnl({
      metrics,
      settlement: settlementAgg,
      adsByPlatform,
      tenantAdsSpend,
    })
  }, [adsByPlatform, displayedPlatforms, kpis?.items, settlementAgg, tenantAdsSpend])
  const currentAgg = alignedPnl.metrics
  const reportsCm = reportsKpis.data?.contribution_margin
  const reportsNet = reportsKpis.data?.net_revenue
  const cmMismatch =
    reportsCm != null &&
    Math.abs(reportsCm - (currentAgg.total?.contribution_margin ?? 0)) >= 1
  const netMismatch =
    reportsNet != null && Math.abs(reportsNet - (currentAgg.total?.net_revenue ?? 0)) >= 1
  const blankTotalLineIds = [
    ...(netMismatch ? (['net_revenue'] as const) : []),
    ...(cmMismatch ? (['contribution_margin', 'cm_pct', 'ebitda', 'ebitda_pct'] as const) : []),
  ]
  const tenantName = me?.tenant_name?.trim() || t('shellSidebarWorkspaceFallback')
  const dataNote = t('productsGroupAnalyticsDataNote')
    .replace('{tenant}', tenantName)
    .replace('{range}', formatInsightRange(startDate, endDate, lang))
  const cobroSettlement = useMemo(() => {
    if (!taxRates) return settlementAgg
    const estimates = estimateSettlementTaxByPlatform(
      settlementAgg,
      displayedPlatforms,
      taxRates,
    )
    const next = { ...settlementAgg }
    let tax = 0
    let payout = 0
    for (const platform of displayedPlatforms) {
      const aligned = settlementWithEstimatedTax(
        settlementAgg[platform.slug],
        estimates[platform.slug]?.withholding_total ?? 0,
      )
      const withPayout = {
        ...aligned,
        estimated_payout:
          aligned.net_revenue -
          aligned.marketplace_fees -
          aligned.shipping_charges -
          aligned.tax_withholdings,
      }
      next[platform.slug] = withPayout
      tax += withPayout.tax_withholdings
      payout += withPayout.estimated_payout
    }
    if (next.total) {
      next.total = { ...next.total, tax_withholdings: tax, estimated_payout: payout }
    }
    return next
  }, [displayedPlatforms, settlementAgg, taxRates])

  const pageAlerts = useMemo(() => {
    type PageAlertItem = {
      key: string
      title: string
      icon: LucideIcon
      tone: ContextAlertTone
    }
    const items: PageAlertItem[] = []
    if (cmIncomplete) {
      items.push({
        key: 'cm-incomplete',
        title: t('channelsCmIncompleteNotice'),
        icon: BarChart3,
        tone: 'warning',
      })
    }
    return items
  }, [cmIncomplete, t])

  const isInitialLoad =
    connectorsLoading || (queriesEnabled && kpisLoading && !kpis)

  const pickerStrings = dateRangePickerStrings(t)

  return (
    <DashboardPage className={cn('flex flex-1 flex-col', hasNoIntegrations ? 'gap-0' : 'gap-8')}>
      {!hasNoIntegrations ? (
        <header className="flex flex-col gap-4">
          <div className="min-w-0">
            <h1 className={pageTitleClassName}>
              {t('channelsPageTitle')}
            </h1>
            <p className={cn('mt-1', pageSubtitleClassName)}>
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
            <FilterComboboxSingle
              label={t('channelsValueFilter')}
              options={[
                { value: 'money', label: t('channelsMoneyBasis') },
                { value: 'pct', label: t('channelsPctOfNet') },
              ]}
              value={amountBasis}
              onValueChange={(value) => {
                if (value === 'money' || value === 'pct') setAmountBasis(value)
              }}
              searchPlaceholder={t('filterSearch')}
              emptyLabel={t('channelsMoneyBasis')}
              allowClear={false}
              triggerClassName="cursor-pointer"
            />
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-border-subtle p-0.5">
                {(
                  [
                    ['pnl', t('channelsViewPnl')],
                    ['cobro', t('channelsViewCobro')],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      'h-7 cursor-pointer rounded-md px-3 text-xs font-medium transition-colors',
                      vista === value
                        ? 'bg-text-primary text-white'
                        : 'text-[#767676] hover:text-text-primary',
                    )}
                    onClick={() => setVista(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
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
          {vista === 'pnl' && (cmMismatch || netMismatch) ? (
            <ContextAlertCard
              title={t('channelsReconciliationAlert')}
              icon={AlertTriangle}
              tone="warning"
            />
          ) : null}
          {vista === 'pnl' ? (
          <ChannelsPnlTable
            metrics={currentAgg}
            platforms={displayedPlatforms}
            t={t}
            labelForRow={labelForRow}
            cmIncomplete={cmIncomplete}
            detailLevel="full"
            adsByPlatform={adsByPlatform}
            tenantAdsSpend={alignedPnl.unlinkedAds}
            blankTotalLineIds={blankTotalLineIds}
            amountBasis={amountBasis}
            fixedOperatingExpenses={reportsKpis.data?.fixed_operating_expenses ?? null}
          />
          ) : (
          <ChannelsSettlementTable
            metrics={cobroSettlement}
            platforms={displayedPlatforms}
            t={t}
            amountBasis={amountBasis}
          />
          )}
          {vista === 'pnl' ? (
            <SectionContainer framed>
              <ChartSectionHeader title={t('channelsNetSalesSplitTitle')} />
              <ChannelsCostStructureChart
                metrics={currentAgg}
                platforms={displayedPlatforms}
                t={t}
              />
            </SectionContainer>
          ) : null}
          <p className="mb-8 text-xs text-text-tertiary">{dataNote}</p>
        </div>
      )}
    </DashboardPage>
  )
}
