import { useMemo } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  homeV2TrendMetricOptions,
  type HomeV2TrendMetricContext,
  type HomeV2TrendMetricId,
} from '@/pages/dashboard/home-v2-trend-metrics'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'

export type HomeV2SalesTrendMetricFiltersProps = {
  primaryMetric: HomeV2TrendMetricId
  secondaryMetric: HomeV2TrendMetricId
  onPrimaryMetricChange: (value: HomeV2TrendMetricId) => void
  onSecondaryMetricChange: (value: HomeV2TrendMetricId) => void
  metricContext: HomeV2TrendMetricContext
  t: (key: ShellStringKey) => string
}

export function HomeV2SalesTrendMetricFilters({
  primaryMetric,
  secondaryMetric,
  onPrimaryMetricChange,
  onSecondaryMetricChange,
  metricContext,
  t,
}: HomeV2SalesTrendMetricFiltersProps) {
  const options = useMemo(
    () => homeV2TrendMetricOptions(metricContext, t),
    [metricContext, t],
  )

  const handlePrimaryChange = (value: string) => {
    if (!isTrendMetricId(value)) return
    onPrimaryMetricChange(value)
    if (value === secondaryMetric) {
      onSecondaryMetricChange(primaryMetric)
    }
  }

  const handleSecondaryChange = (value: string) => {
    if (!isTrendMetricId(value)) return
    onSecondaryMetricChange(value)
    if (value === primaryMetric) {
      onPrimaryMetricChange(secondaryMetric)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="min-w-[10.5rem] shrink-0">
        <FilterComboboxSingle
          label={t('homeSalesTrendMetricPrimary')}
          options={options}
          value={primaryMetric}
          onValueChange={handlePrimaryChange}
          searchPlaceholder={t('filterSearch')}
          emptyLabel={t('filterComingSoon')}
          selectionMode="single"
          allowClear={false}
          popoverAlign="end"
          popoverSide="bottom"
        />
      </div>
      <div className="min-w-[10.5rem] shrink-0">
        <FilterComboboxSingle
          label={t('homeSalesTrendMetricSecondary')}
          options={options}
          value={secondaryMetric}
          onValueChange={handleSecondaryChange}
          searchPlaceholder={t('filterSearch')}
          emptyLabel={t('filterComingSoon')}
          selectionMode="single"
          allowClear={false}
          popoverAlign="end"
          popoverSide="bottom"
        />
      </div>
    </div>
  )
}

function isTrendMetricId(value: string): value is HomeV2TrendMetricId {
  return (
    value === 'net-sales' ||
    value === 'net-profit' ||
    value === 'contribution' ||
    value === 'ebitda' ||
    value === 'units' ||
    value === 'orders' ||
    value === 'roas'
  )
}
