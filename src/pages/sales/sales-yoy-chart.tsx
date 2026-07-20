import { useCallback } from 'react'

import type { Locale } from 'date-fns'
import type { MonthlyRevenueMonthRow, RevenueSeriesGranularity } from '@/lib/types/reports'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { DashboardRevenueTrendChart } from '@/pages/dashboard/dashboard-revenue-trend-chart'

export type SalesYoyChartProps = {
  startDate: string
  endDate: string
  prevStart: string
  prevEnd: string
  granularity: RevenueSeriesGranularity
  rowsCurrent: MonthlyRevenueMonthRow[]
  rowsPrev: MonthlyRevenueMonthRow[]
  currency: string
  formatValue: (value: number) => string
  convertValue: (value: number) => number
  dateLocale: Locale
  t: (key: ShellStringKey) => string
}

export function SalesYoyChart({
  startDate,
  endDate,
  prevStart,
  prevEnd,
  granularity,
  rowsCurrent,
  rowsPrev,
  currency,
  formatValue,
  convertValue,
  dateLocale,
  t,
}: SalesYoyChartProps) {
  const tYoy = useCallback(
    (key: ShellStringKey) => {
      if (key === 'dashboardRevenueSeriesCurrent') return t('salesYoySeriesCurrent')
      if (key === 'dashboardRevenueSeriesPrevious') return t('salesYoySeriesPrevious')
      return t(key)
    },
    [t],
  )

  return (
    <DashboardRevenueTrendChart
      startDate={startDate}
      endDate={endDate}
      prevStart={prevStart}
      prevEnd={prevEnd}
      granularity={granularity}
      rowsCurrent={rowsCurrent}
      rowsPrev={rowsPrev}
      comparePrevious
      currency={currency}
      formatValue={formatValue}
      convertValue={convertValue}
      dateLocale={dateLocale}
      t={tYoy}
    />
  )
}
