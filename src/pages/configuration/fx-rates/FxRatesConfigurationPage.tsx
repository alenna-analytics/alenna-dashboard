import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import {
  SettingsCard,
  SettingsSectionHeader,
} from '@/pages/configuration/settings-layout'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { dateRangePickerStrings, presetDateRangeYmd } from '@/ui/date-range-picker'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import { FilterDates } from '@/ui/filters/filter-dates'
import type { FilterOption } from '@/ui/filters/types'

import { FxRatesChart } from './fx-rates-chart'
import { FxRatesTable } from './fx-rates-table'
import { fxPairKey, type FxRateListResponse, type FxRateRow } from './fx-rates-types'

const DEFAULT_RANGE = presetDateRangeYmd('last30')

export function FxRatesConfigurationPage() {
  const { lang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )
  const { me } = useWorkspace()
  const { tenantId } = useCurrentTenant()
  const { getToken } = useAuth()

  const multiEnabled = Boolean(me?.currency?.multi_currency_enabled)
  const canView = can(me, 'fx.view')

  const [startDate, setStartDate] = useState(DEFAULT_RANGE.start)
  const [endDate, setEndDate] = useState(DEFAULT_RANGE.end)
  const [pairFilter, setPairFilter] = useState('')

  const query = useQuery({
    queryKey: ['fx-rates', tenantId, me?.base_currency],
    enabled: Boolean(tenantId) && multiEnabled && canView,
    queryFn: async (): Promise<FxRateListResponse> => {
      const res = await apiFetch('/admin/fx-rates?limit=1000', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as FxRateListResponse
    },
  })

  const allRows = useMemo(() => query.data?.rates ?? [], [query.data])

  const pairOptions = useMemo<FilterOption[]>(() => {
    const pairs = new Set<string>()
    for (const row of allRows) pairs.add(fxPairKey(row))
    return Array.from(pairs)
      .sort((a, b) => a.localeCompare(b))
      .map((pair) => ({ value: pair, label: pair }))
  }, [allRows])

  const selectedPair = useMemo(() => {
    if (pairFilter && pairOptions.some((option) => option.value === pairFilter)) {
      return pairFilter
    }
    return pairOptions[0]?.value ?? ''
  }, [pairFilter, pairOptions])

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (selectedPair && fxPairKey(row) !== selectedPair) return false
      if (startDate && row.rate_date < startDate) return false
      if (endDate && row.rate_date > endDate) return false
      return true
    })
  }, [allRows, endDate, selectedPair, startDate])

  const chartRows = useMemo<FxRateRow[]>(() => filteredRows, [filteredRows])
  const pickerStrings = dateRangePickerStrings(t)

  if (!multiEnabled || !canView) {
    return <Navigate to="/dashboard/configuration/general" replace />
  }

  return (
    <DashboardPage className="mx-auto w-full max-w-4xl space-y-10">
      <section>
        <div className="w-full">
          <h1 className={pageTitleClassName}>{t('workspaceConfigFxRatesTitle')}</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
            {t('workspaceConfigFxRatesSubtitle')}
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <SettingsSectionHeader
          title={t('workspaceConfigFxRatesChartTitle')}
          description={
            selectedPair
              ? shellT(lang, 'workspaceConfigFxRatesChartDescription', { pair: selectedPair })
              : t('workspaceConfigFxRatesChartEmpty')
          }
        />
        <div className="flex flex-wrap items-end gap-2">
          <FilterDates
            strings={pickerStrings}
            startValue={startDate}
            endValue={endDate}
            onStartChange={(value) => setStartDate(value ?? '')}
            onEndChange={(value) => setEndDate(value ?? '')}
          />
          <FilterComboboxSingle
            label={t('workspaceConfigFxRatesColPair')}
            options={pairOptions}
            value={selectedPair}
            onValueChange={(value) => setPairFilter(value || '')}
            searchPlaceholder={t('filterSearch')}
            emptyLabel={t('filterComingSoon')}
            clearAriaLabel={t('filterClear')}
            allowClear={false}
            popoverSide="bottom"
          />
        </div>
        <SettingsCard>
          <div className="p-4">
            <FxRatesChart
              rows={chartRows}
              pair={selectedPair}
              lang={lang}
              isLoading={query.isPending}
              isError={query.isError}
            />
          </div>
        </SettingsCard>
      </section>

      <section className="space-y-6">
        <SettingsSectionHeader title={t('workspaceConfigFxRatesListTitle')} />
        {query.isError ? (
          <p className="text-sm text-destructive">{t('workspaceConfigFxRatesLoadFailed')}</p>
        ) : (
          <FxRatesTable
            key={`${selectedPair}:${startDate}:${endDate}`}
            rows={filteredRows}
            isLoading={query.isPending}
            isFetching={query.isFetching}
            t={t}
          />
        )}
      </section>
    </DashboardPage>
  )
}
