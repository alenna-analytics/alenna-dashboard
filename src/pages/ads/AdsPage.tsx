import { useMemo } from 'react'

import { useCurrentTenant } from '@/auth/hooks'
import { useAdsChannels, useAdsKpis } from '@/pages/ads/use-ads-kpis'
import { useIntegrationsListQueries } from '@/pages/integrations/hooks/use-integrations-list-queries'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import { FilterDates } from '@/ui/filters/filter-dates'
import { presetDateRangeYmd } from '@/ui/date-range-picker'
import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { useMoney } from '@/hooks/use-money'

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

export function AdsPage() {
  const { lang } = useLanguage()
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

  const connectionIds = useMemo(
    () => connections.filter((c) => c.status === 'active').map((c) => c.id),
    [connections],
  )

  const kpis = useAdsKpis({
    connectionIds,
    startDate: filters.start,
    endDate: filters.end,
    enabled: connectionIds.length > 0,
  })
  const channels = useAdsChannels({
    connectionIds,
    startDate: filters.start,
    endDate: filters.end,
    enabled: connectionIds.length > 0,
  })

  const data = kpis.data
  const adsCurrency = channels.data?.currency ?? data?.currency

  return (
    <DashboardPage className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={pageTitleClassName}>{shellT(lang, 'navAds')}</h1>
          <p className="mt-1.5 text-xs text-text-secondary">{shellT(lang, 'adsEmptyState')}</p>
        </div>
        <FilterDates
          strings={pickerStrings}
          startValue={filters.start}
          endValue={filters.end}
          onStartChange={(v) => v && setFilters({ start: v, end: filters.end })}
          onEndChange={(v) => v && setFilters({ start: filters.start, end: v })}
        />
      </div>

      {!data ? (
        <p className="text-sm text-text-secondary">{shellT(lang, 'adsEmptyState')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AdsKpiCard label={shellT(lang, 'adsKpiSpend')} value={formatMoney(data.spend, { nativeCurrency: data.currency })} />
          <AdsKpiCard label={shellT(lang, 'adsKpiSales')} value={formatMoney(data.attributed_sales, { nativeCurrency: data.currency })} />
          <AdsKpiCard label={shellT(lang, 'adsKpiRoas')} value={formatRatio(data.roas)} />
          <AdsKpiCard label={shellT(lang, 'adsKpiBreakEvenRoas')} value={formatRatio(data.break_even_roas)} />
          <AdsKpiCard
            label={shellT(lang, 'adsKpiTacos')}
            value={data.case_c ? '—' : formatRatio(data.tacos)}
          />
          <AdsKpiCard label={shellT(lang, 'adsKpiCpa')} value={formatRatio(data.cpa)} />
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-text-primary">
          {shellT(lang, 'adsChannelTableTitle')}
        </h2>
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
                <tr key={`${row.platform}-${row.connection_id ?? 'none'}`} className="border-t border-border-subtle">
                  <td className="px-3 py-2">{row.platform}</td>
                  <td className="px-3 py-2">
                    {formatMoney(row.spend, adsCurrency ? { nativeCurrency: adsCurrency } : undefined)}
                  </td>
                  <td className="px-3 py-2">
                    {formatMoney(
                      row.attributed_sales,
                      adsCurrency ? { nativeCurrency: adsCurrency } : undefined,
                    )}
                  </td>
                  <td className="px-3 py-2">{formatRatio(row.roas)}</td>
                  <td className="px-3 py-2">{formatRatio(row.tacos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardPage>
  )
}

function AdsKpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-white p-4">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 text-lg font-medium text-text-primary">{value}</p>
    </div>
  )
}
