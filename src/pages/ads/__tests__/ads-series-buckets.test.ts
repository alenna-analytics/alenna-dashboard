import { describe, expect, it } from 'vitest'
import { enUS } from 'date-fns/locale'

import { adsPointBucketKey, bucketAdsSeriesPoints } from '@/pages/ads/ads-series-buckets'
import type { AdsSeriesPoint } from '@/pages/ads/use-ads-kpis'

function point(date: string, spend: number, sales: number): AdsSeriesPoint {
  return {
    date,
    spend,
    attributed_sales: sales,
    attributed_conversions: 0,
    impressions: 0,
    clicks: 0,
  }
}

describe('adsPointBucketKey', () => {
  it('keeps calendar days, weeks starting Monday, and month starts', () => {
    expect(adsPointBucketKey('2026-01-07', 'day')).toBe('2026-01-07')
    expect(adsPointBucketKey('2026-01-07', 'week')).toBe('2026-01-05')
    expect(adsPointBucketKey('2026-01-20', 'month')).toBe('2026-01-01')
  })
})

describe('bucketAdsSeriesPoints', () => {
  it('sums spend and sales into week buckets across the range', () => {
    const rows = bucketAdsSeriesPoints(
      [point('2026-01-05', 10, 40), point('2026-01-06', 20, 80), point('2026-01-12', 5, 15)],
      '2026-01-05',
      '2026-01-12',
      'week',
      enUS,
    )
    expect(rows).toHaveLength(2)
    expect(rows[0]?.spend).toBe(30)
    expect(rows[0]?.sales).toBe(120)
    expect(rows[1]?.spend).toBe(5)
    expect(rows[1]?.sales).toBe(15)
  })

  it('fills empty day buckets in the selected range', () => {
    const rows = bucketAdsSeriesPoints(
      [point('2026-01-02', 8, 16)],
      '2026-01-01',
      '2026-01-03',
      'day',
      enUS,
    )
    expect(rows.map((row) => row.spend)).toEqual([0, 8, 0])
    expect(rows.map((row) => row.sales)).toEqual([0, 16, 0])
  })
})
