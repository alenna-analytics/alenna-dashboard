import { describe, expect, it } from 'vitest'

import {
  buildProductPnlWaterfallSegments,
  productPnlWaterfallSourceFromPeriod,
} from './product-detail-pnl-waterfall-segments'

const t = (key: string) => key

describe('productPnlWaterfallSourceFromPeriod', () => {
  it('uses settlement discounts and returns when present', () => {
    const source = productPnlWaterfallSourceFromPeriod(
      {
        period_gross_sales: 1000,
        period_net_sales: 800,
        period_cogs: 200,
        gross_profit: 600,
        contribution_margin: 400,
      },
      {
        gross_revenue: 1000,
        discounts: 120,
        returns: 80,
        net_revenue: 800,
        marketplace_fees: 90,
        shipping_charges: 40,
        tax_withholdings: 0,
        estimated_payout: 670,
        completeness: 'full',
      },
    )
    expect(source.discounts).toBe(120)
    expect(source.returns).toBe(80)
    expect(source.marketplaceFees).toBe(90)
  })

  it('falls back to gross minus net when settlement has no deductions', () => {
    const source = productPnlWaterfallSourceFromPeriod(
      {
        period_gross_sales: 1000,
        period_net_sales: 850,
        period_cogs: 200,
        gross_profit: 650,
        contribution_margin: 650,
      },
      null,
    )
    expect(source.discounts).toBe(150)
    expect(source.returns).toBe(0)
    expect(source.marketplaceFees).toBe(0)
  })
})

describe('buildProductPnlWaterfallSegments', () => {
  it('runs from gross sales to net profit without opex or ebitda', () => {
    const segments = buildProductPnlWaterfallSegments(
      {
        grossSales: 1000,
        netSales: 800,
        cogs: 200,
        grossProfit: 600,
        contributionMargin: 470,
        discounts: 120,
        returns: 80,
        marketplaceFees: 90,
        shippingCharges: 40,
      },
      t,
    )
    expect(segments.map((s) => s.name)).toEqual([
      'reportsWfGrossRevenue',
      'reportsWfDiscountsReturns',
      'reportsWfNetRevenue',
      'reportsWfCogs',
      'reportsWfGrossProfit',
      'reportsKpiPlatformFees',
      'reportsKpiFulfillmentCost',
      'reportsNetProfit',
    ])
    expect(segments[segments.length - 1]?.value).toBe(470)
    expect(segments.some((s) => s.name === 'reportsWfEbitda')).toBe(false)
  })
})
