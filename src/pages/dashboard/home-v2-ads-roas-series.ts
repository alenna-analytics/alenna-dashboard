import { format, startOfMonth, startOfWeek } from 'date-fns'
import type { Locale } from 'date-fns'

import type { AdsSeriesPoint } from '@/pages/ads/use-ads-kpis'
import type { MonthlyChartRow } from '@/pages/reports/monthly-revenue-chart'
import { eachRevenueBucketMeta, parseLocalYmd } from '@/pages/reports/reports-ui-helpers'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'

function adsPointBucketKey(dateYmd: string, granularity: RevenueSeriesGranularity): string {
  const d = parseLocalYmd(dateYmd.slice(0, 10))
  if (granularity === 'day') return format(d, 'yyyy-MM-dd')
  if (granularity === 'month') return format(startOfMonth(d), 'yyyy-MM-dd')
  return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function withAdsRoasOnChartRows(
  rows: MonthlyChartRow[],
  points: AdsSeriesPoint[],
  startYmd: string,
  endYmd: string,
  granularity: RevenueSeriesGranularity,
  locale: Locale,
): MonthlyChartRow[] {
  const meta = eachRevenueBucketMeta(startYmd, endYmd, granularity, locale)
  const spendByKey = new Map<string, number>()
  const salesByKey = new Map<string, number>()
  for (const point of points) {
    const key = adsPointBucketKey(point.date, granularity)
    spendByKey.set(key, (spendByKey.get(key) ?? 0) + point.spend)
    salesByKey.set(key, (salesByKey.get(key) ?? 0) + point.attributed_sales)
  }
  return rows.map((row, index) => {
    const key = meta[index]?.bucketKey
    const spend = key ? (spendByKey.get(key) ?? 0) : 0
    const sales = key ? (salesByKey.get(key) ?? 0) : 0
    return {
      ...row,
      roas: spend > 0 ? sales / spend : 0,
    }
  })
}
