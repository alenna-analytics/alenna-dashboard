import { describe, expect, it } from 'vitest'

import {
  buildGroupStatement,
  effectiveTaxRate,
  finalizeGroupStatement,
  type GroupStatementMember,
} from './group-statement'

const rates = {
  withholding_isr_pct: 2.5,
  withholding_iva_pct: 8,
  transferred_iva_pct: 16,
}

function member(partial: Partial<GroupStatementMember> & Pick<GroupStatementMember, 'productId' | 'platform'>): GroupStatementMember {
  return {
    label: partial.productId,
    grossSales: 0,
    netSales: 0,
    grossUnits: 0,
    netUnits: 0,
    cost: 190,
    hasSettlement: true,
    cogs: null,
    settlementGross: 0,
    settlementNet: 0,
    discounts: 0,
    returns: 0,
    fees: 0,
    shipping: 0,
    taxReal: 0,
    cancelCost: 0,
    ...partial,
  }
}

describe('buildGroupStatement', () => {
  const members = [
    member({
      productId: 'ml-a',
      platform: 'mercadolibre',
      settlementGross: 1000,
      settlementNet: 900,
      discounts: 0,
      returns: 100,
      fees: 80,
      shipping: 20,
      taxReal: 70,
      grossUnits: 12,
      netUnits: 10,
      netSales: 900,
    }),
    member({
      productId: 'ml-b',
      platform: 'mercadolibre',
      settlementGross: 400,
      settlementNet: 400,
      fees: 30,
      grossUnits: 4,
      netUnits: 4,
      netSales: 400,
    }),
    member({
      productId: 'amz',
      platform: 'amazon',
      settlementGross: 500,
      settlementNet: 450,
      discounts: 50,
      fees: 90,
      shipping: 0,
      taxReal: 0,
      grossUnits: 6,
      netUnits: 5,
      netSales: 450,
    }),
  ]

  it('uses units × cost for COGS and sums publication fees onto the channel', () => {
    const statement = buildGroupStatement({
      members,
      platforms: [],
      mode: 'channel',
      labelForPlatform: (platform) => platform,
    })
    const ml = statement.columns.find((column) => column.id === 'mercadolibre')
    const amazon = statement.columns.find((column) => column.id === 'amazon')
    expect(ml).toMatchObject({
      publicationCount: 2,
      cogs: 14 * 190,
      fees: 110,
      shipping: 20,
      netUnits: 14,
      net: 1300,
      taxReal: 70,
    })
    expect(amazon).toMatchObject({ cogs: 5 * 190, fees: 90, netUnits: 5 })
    expect(statement.total.cogs).toBe(19 * 190)
    expect(statement.total.fees).toBe(200)
    expect(statement.total.netUnits).toBe(19)
  })

  it('keeps real withholdings and estimates the rest on net sales without IVA', () => {
    const built = buildGroupStatement({
      members,
      platforms: [],
      mode: 'channel',
      labelForPlatform: (platform) => platform,
    })
    const statement = finalizeGroupStatement(built.columns, rates)
    const ml = statement.columns.find((column) => column.platform === 'mercadolibre')
    const amazon = statement.columns.find((column) => column.platform === 'amazon')
    expect(ml?.tax).toBe(70)
    expect(ml?.payout).toBeCloseTo(1300 - 110 - 20 - 70)
    expect(amazon?.tax).toBeCloseTo(40.73)
    expect(amazon?.payout).toBeCloseTo(450 - 90 - amazon!.tax)
    expect(statement.total.tax).toBeCloseTo(70 + amazon!.tax)
    expect(statement.total.payout).toBeCloseTo(ml!.payout + amazon!.payout)
    expect(effectiveTaxRate(ml!, 16)).toBeCloseTo((70 / (1300 / 1.16)) * 100)
  })
})
