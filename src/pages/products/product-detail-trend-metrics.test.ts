import { describe, expect, it } from 'vitest'

import {
  isProductDetailTrendMetricChartable,
  productDetailTrendPeriodValueFromFiltered,
  type ProductDetailPeriodView,
} from './product-detail-trend-metrics'

function periodView(partial: Partial<ProductDetailPeriodView> = {}): ProductDetailPeriodView {
  return {
    period_gross_sales: 1100,
    period_net_sales: 1000,
    period_gross_profit: 900,
    gross_profit: 800,
    contribution_margin: 650,
    contribution_margin_pct: 65,
    gross_margin_pct: 80,
    cm_incomplete: false,
    period_gross_units_sold: 10,
    period_units_sold: 10,
    period_orders: 5,
    inventory_days: 30,
    ...partial,
  }
}

describe('productDetailTrendPeriodValueFromFiltered', () => {
  it('maps gross-profit to net-based gross_profit', () => {
    const view = periodView()
    expect(productDetailTrendPeriodValueFromFiltered(view, 'gross-profit')).toBe(800)
  })

  it('maps net-profit to contribution_margin', () => {
    const view = periodView()
    expect(productDetailTrendPeriodValueFromFiltered(view, 'net-profit')).toBe(650)
  })

  it('maps contribution-margin-pct from API field', () => {
    const view = periodView()
    expect(productDetailTrendPeriodValueFromFiltered(view, 'contribution-margin-pct')).toBe(65)
  })
})

describe('isProductDetailTrendMetricChartable', () => {
  it('excludes net profit and contribution margin pct from charts in v1', () => {
    expect(isProductDetailTrendMetricChartable('gross-profit')).toBe(true)
    expect(isProductDetailTrendMetricChartable('net-profit')).toBe(false)
    expect(isProductDetailTrendMetricChartable('contribution-margin-pct')).toBe(false)
  })
})
