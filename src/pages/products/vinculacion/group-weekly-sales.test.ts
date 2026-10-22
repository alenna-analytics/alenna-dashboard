import { describe, expect, it } from 'vitest'

import { buildWeeklyNetSalesBars, formatInsightRange } from './group-weekly-sales'

describe('buildWeeklyNetSalesBars', () => {
  it('marks weeks that fall outside the filter or past today as incomplete', () => {
    const bars = buildWeeklyNetSalesBars(
      [
        { month_start: '2026-07-27', gross_revenue: 0, net_revenue: 61000, gross_profit: 0, gross_margin_pct: 0, units_sold: 96 },
        { month_start: '2026-08-03', gross_revenue: 0, net_revenue: 219000, gross_profit: 0, gross_margin_pct: 0, units_sold: 341 },
        { month_start: '2026-09-21', gross_revenue: 0, net_revenue: 211000, gross_profit: 0, gross_margin_pct: 0, units_sold: 310 },
      ],
      '2026-07-31',
      '2026-09-24',
      'es',
      new Date(2026, 8, 24),
    )

    expect(bars[0]).toMatchObject({ weekLabel: '27 jul', incomplete: true, units: 96 })
    expect(bars.find((bar) => bar.weekStart === '2026-08-03')).toMatchObject({
      weekLabel: '3 ago',
      incomplete: false,
      netSales: 219000,
    })
    expect(bars.at(-1)).toMatchObject({ weekLabel: '21 sep', incomplete: true, units: 310 })
    expect(bars).toHaveLength(9)
  })
})

describe('formatInsightRange', () => {
  it('keeps the year once when both dates share it', () => {
    expect(formatInsightRange('2026-07-31', '2026-09-24', 'es')).toBe('31 jul – 24 sep 2026')
  })
})
