import { format, startOfMonth, startOfWeek, type Locale } from 'date-fns'

import type { AdsSeriesPoint } from '@/pages/ads/use-ads-kpis'
import { eachRevenueBucketMeta, parseLocalYmd } from '@/pages/reports/reports-ui-helpers'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'

export type AdsTrendChartRow = {
  label: string
  spend: number
  sales: number
}

export function adsPointBucketKey(
  dateYmd: string,
  granularity: RevenueSeriesGranularity,
): string {
  const d = parseLocalYmd(dateYmd.slice(0, 10))
  if (granularity === 'day') return format(d, 'yyyy-MM-dd')
  if (granularity === 'month') return format(startOfMonth(d), 'yyyy-MM-dd')
  return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function bucketAdsSeriesPoints(
  points: AdsSeriesPoint[],
  startYmd: string,
  endYmd: string,
  granularity: RevenueSeriesGranularity,
  locale: Locale,
): AdsTrendChartRow[] {
  const meta = eachRevenueBucketMeta(startYmd, endYmd, granularity, locale)
  const spendByKey = new Map<string, number>()
  const salesByKey = new Map<string, number>()
  for (const point of points) {
    const key = adsPointBucketKey(point.date, granularity)
    spendByKey.set(key, (spendByKey.get(key) ?? 0) + point.spend)
    salesByKey.set(key, (salesByKey.get(key) ?? 0) + point.attributed_sales)
  }
  return meta.map((bucket) => ({
    label: bucket.label,
    spend: spendByKey.get(bucket.bucketKey) ?? 0,
    sales: salesByKey.get(bucket.bucketKey) ?? 0,
  }))
}
