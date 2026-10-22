import { describe, expect, it } from 'vitest'

import type {
  ProductLinkGroupApi,
  ProductLinkGroupMemberApi,
} from '@/lib/types/product-links'

import {
  buildChannelCoverRows,
  reorderPointUnits,
  stockoutDate,
} from './group-channel-cover'

function member(
  overrides: Partial<ProductLinkGroupMemberApi> & Pick<ProductLinkGroupMemberApi, 'product_id' | 'platform'>,
): ProductLinkGroupMemberApi {
  return {
    title: overrides.product_id,
    image_url: null,
    platform_title: null,
    platform_sku: null,
    variant_label: null,
    cost: null,
    listings_count: 1,
    stock_quantity: 0,
    platform_price: null,
    matchable: true,
    period_gross_units_sold: 0,
    period_net_units_sold: 0,
    period_gross_sales: 0,
    period_net_sales: 0,
    period_orders: 0,
    ...overrides,
  }
}

function group(overrides: Partial<ProductLinkGroupApi> = {}): ProductLinkGroupApi {
  return {
    id: 'g1',
    title: 'Creatina',
    members: [],
    period_gross_units_sold: 0,
    period_net_units_sold: 0,
    period_cogs: 0,
    period_gross_sales: 0,
    period_net_sales: 0,
    period_gross_profit: 0,
    period_orders: 0,
    gross_margin_pct: 0,
    contribution_margin: 0,
    contribution_margin_pct: 0,
    channel_margin: 0,
    channel_margin_pct: 0,
    cm_incomplete: false,
    velocity_units_per_day_90d: 32.15,
    consolidated_stock_quantity: 1184,
    inventory_days: 189,
    period_by_platform: [],
    period_settlement: {
      gross_revenue: 0,
      discounts: 0,
      returns: 0,
      net_revenue: 0,
      marketplace_fees: 0,
      shipping_charges: 0,
      tax_withholdings: 0,
      estimated_payout: 0,
      completeness: 'complete',
    },
    period_settlement_by_platform: [],
    period_start: null,
    period_end: null,
    base_currency: 'MXN',
    ...overrides,
  }
}

const today = new Date(2026, 8, 24)

describe('buildChannelCoverRows', () => {
  const members = [
    member({ product_id: 'amz', platform: 'amazon', stock_quantity: 18 }),
    member({ product_id: 'ml-1', platform: 'mercadolibre', stock_quantity: 1020 }),
    member({ product_id: 'ml-2', platform: 'mercadolibre', stock_quantity: 146 }),
  ]

  it('uses total stock divided by total velocity and flags the critical channel', () => {
    const rows = buildChannelCoverRows(
      group({
        members,
        inventory_by_platform: [
          { platform: 'amazon', stock_quantity: 18, velocity_units_per_day_90d: 6.25, inventory_days: 189 },
          {
            platform: 'mercadolibre',
            stock_quantity: 1166,
            velocity_units_per_day_90d: 25.9,
            inventory_days: 45,
          },
        ],
      }),
      members,
      today,
    )

    const amazon = rows[0]
    const meli = rows[1]
    const total = rows[2]
    expect(amazon?.inventoryDays).toBe(2.9)
    expect(amazon?.alert).toBe('critical')
    expect(amazon?.publicationCount).toBe(1)
    expect(meli?.stock).toBe(1166)
    expect(meli?.memberStocks).toEqual([1020, 146])
    expect(meli?.inventoryDays).toBe(45)
    expect(meli?.alert).toBe('normal')
    expect(total?.stock).toBe(1184)
    expect(total?.velocity).toBeCloseTo(32.15, 5)
    expect(total?.inventoryDays).toBe(36.8)
    expect(total?.alert).toBe('critical')
    expect(total?.stockoutOn).toBeNull()
    expect(amazon?.leadTimeMissing).toBe(true)
  })

  it('does not divide total stock by a single channel velocity', () => {
    const rows = buildChannelCoverRows(
      group({
        members,
        inventory_by_platform: [
          { platform: 'amazon', stock_quantity: 18, velocity_units_per_day_90d: 6.25, inventory_days: null },
          {
            platform: 'mercadolibre',
            stock_quantity: 1166,
            velocity_units_per_day_90d: null,
            inventory_days: null,
          },
        ],
      }),
      members,
      today,
    )
    expect(rows.at(-1)?.inventoryDays).toBeNull()
    expect(rows.at(-1)?.velocity).toBeNull()
  })
})

describe('stockoutDate', () => {
  it('rounds days of cover onto the calendar', () => {
    const date = stockoutDate(2.9, new Date(2026, 8, 24))
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(8)
    expect(date?.getDate()).toBe(27)
  })
})

describe('reorderPointUnits', () => {
  it('is velocity times lead time times 1.2', () => {
    expect(reorderPointUnits(10, 5)).toBe(60)
    expect(reorderPointUnits(10, null)).toBeNull()
  })
})
