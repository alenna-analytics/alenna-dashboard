import { describe, expect, it } from 'vitest'

import { buildProductCostPriceChartData, fillSeriesForDates } from '../product-cost-chart-points'

describe('fillSeriesForDates', () => {
  it('uses the segment that covers each calendar day (last price of day semantics)', () => {
    const segments = [
      { effective_from: '2025-04-01', effective_to: '2025-04-12', value: 100 },
      { effective_from: '2025-04-13', effective_to: null, value: 200 },
    ]
    const dates = ['2025-04-12', '2025-04-13', '2025-04-14']
    const m = fillSeriesForDates(segments, dates)
    expect(m.get('2025-04-12')).toBe(100)
    expect(m.get('2025-04-13')).toBe(200)
    expect(m.get('2025-04-14')).toBe(200)
  })
})

describe('buildProductCostPriceChartData', () => {
  it('densifies the x-axis so each day in range has an explicit channel value', () => {
    const { points, series } = buildProductCostPriceChartData(
      [],
      [
        {
          listing_id: '00000000-0000-0000-0000-000000000001',
          platform: 'shopify',
          platform_sku: 'x',
          currency: 'MXN',
          effective_from: '2025-04-10',
          effective_to: '2025-04-11',
          price: 1077.7,
        },
        {
          listing_id: '00000000-0000-0000-0000-000000000001',
          platform: 'shopify',
          platform_sku: 'x',
          currency: 'MXN',
          effective_from: '2025-04-12',
          effective_to: null,
          price: 746.4,
        },
      ],
      { todayYmd: '2025-04-14', baseCurrency: 'MXN' },
    )
    const shopKey = series.find((s) => s.kind === 'channel')?.key
    expect(shopKey).toBeDefined()
    const apr11 = points.find((p) => p.dateKey === '2025-04-11')
    const apr12 = points.find((p) => p.dateKey === '2025-04-12')
    expect(apr11?.values[shopKey!]).toBeCloseTo(1077.7, 4)
    expect(apr12?.values[shopKey!]).toBeCloseTo(746.4, 4)
  })
})
