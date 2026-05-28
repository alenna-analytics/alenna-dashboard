import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'

export function revenueTrendSubtitleForGranularity(
  granularity: RevenueSeriesGranularity,
  t: (key: ShellStringKey) => string,
): string {
  if (granularity === 'week') return t('dashboardRevenueTrendSubtitleWeek')
  if (granularity === 'day') return t('dashboardRevenueTrendSubtitleDay')
  return t('dashboardRevenueTrendSubtitleMonth')
}
