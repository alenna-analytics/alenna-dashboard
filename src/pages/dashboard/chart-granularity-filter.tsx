import { useMemo } from 'react'

import type { RevenueSeriesGranularity } from '@/lib/types/reports'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'

export type ChartGranularityFilterProps = {
  value: RevenueSeriesGranularity
  onChange: (value: RevenueSeriesGranularity) => void
  t: (key: ShellStringKey) => string
}

export function ChartGranularityFilter({ value, onChange, t }: ChartGranularityFilterProps) {
  const options = useMemo(
    () => [
      { value: 'month', label: t('dashboardRevenueGranularityMonth') },
      { value: 'week', label: t('dashboardRevenueGranularityWeek') },
      { value: 'day', label: t('dashboardRevenueGranularityDay') },
    ],
    [t],
  )

  return (
    <div className="min-w-[10.5rem] shrink-0">
      <FilterComboboxSingle
        label={t('dashboardRevenueGranularityLabel')}
        options={options}
        value={value}
        onValueChange={(v) => {
          if (v === 'month' || v === 'week' || v === 'day') onChange(v)
        }}
        applyLabel={t('datePickerApply')}
        searchPlaceholder={t('filterSearch')}
        emptyLabel={t('filterComingSoon')}
        allowClear={false}
        popoverAlign="end"
        popoverSide="bottom"
      />
    </div>
  )
}
