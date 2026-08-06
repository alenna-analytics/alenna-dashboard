import { describe, expect, it } from 'vitest'

import type { AlertItemApi } from '@/lib/types/alerts'
import type { ProductDetailApi } from '@/lib/types/catalog'

import {
  activeStockAlertsForProduct,
  buildAlertRows,
  filterVisibleAlertRows,
  resolveAlertIdsForRow,
  type ProductDetailAlertRow,
} from '../product-detail-stock-alert-utils'

const productId = '11111111-1111-1111-1111-111111111111'
const otherProductId = '22222222-2222-2222-2222-222222222222'
const listingId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const otherListingId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

function stockAlert(overrides: Partial<AlertItemApi> = {}): AlertItemApi {
  return {
    id: 'alert-1',
    alert_type: 'stock',
    severity: 'critical',
    title: 'Out of stock',
    triggered_at: '2026-08-06T12:00:00Z',
    postponed_until: null,
    platform_connection_id: 'conn-1',
    entity_type: 'product_listing',
    entity_id: listingId,
    product_id: productId,
    platform: 'mercadolibre',
    platform_sku: 'SKU-A',
    payload: {},
    ...overrides,
  }
}

function summaryEntry(
  overrides: Partial<NonNullable<ProductDetailApi['stock_alert_summary']>[number]> = {},
): NonNullable<ProductDetailApi['stock_alert_summary']>[number] {
  return {
    platform: 'mercadolibre',
    stock_alert: 'out',
    stock_quantity: 0,
    listing_id: listingId,
    prev_month_units_sold: 0,
    ...overrides,
  }
}

const t = (key: string) => key

describe('activeStockAlertsForProduct', () => {
  it('includes alerts matched by product_id', () => {
    const alerts = [stockAlert()]
    expect(activeStockAlertsForProduct(alerts, productId, [listingId])).toHaveLength(1)
  })

  it('includes alerts matched by listing entity_id', () => {
    const alerts = [stockAlert({ product_id: null })]
    expect(activeStockAlertsForProduct(alerts, productId, [listingId])).toHaveLength(1)
  })

  it('excludes alerts for another product', () => {
    const alerts = [stockAlert({ product_id: otherProductId, entity_id: otherListingId })]
    expect(activeStockAlertsForProduct(alerts, productId, [listingId])).toHaveLength(0)
  })
})

describe('resolveAlertIdsForRow', () => {
  it('matches by listing id', () => {
    const ids = resolveAlertIdsForRow([stockAlert({ id: 'a1' })], 'mercadolibre', [listingId])
    expect(ids).toEqual(['a1'])
  })

  it('matches by platform slug', () => {
    const ids = resolveAlertIdsForRow(
      [stockAlert({ id: 'a2', entity_id: otherListingId })],
      'mercadolibre',
      [listingId],
    )
    expect(ids).toEqual(['a2'])
  })
})

describe('filterVisibleAlertRows', () => {
  const row: ProductDetailAlertRow = {
    platformSlug: 'mercadolibre',
    platformLabel: 'Mercado Libre',
    level: 'out',
    stockQuantity: 0,
    listingIds: [listingId],
    alertIds: ['alert-1'],
  }

  it('returns empty while loading', () => {
    expect(
      filterVisibleAlertRows([row], { isSuccess: false, isError: false, isLoading: true }),
    ).toEqual([])
  })

  it('returns empty on error', () => {
    expect(
      filterVisibleAlertRows([row], { isSuccess: false, isError: true, isLoading: false }),
    ).toEqual([])
  })

  it('hides postponed rows after success when alertIds are empty', () => {
    const postponedRow = { ...row, alertIds: [] as string[] }
    expect(
      filterVisibleAlertRows([postponedRow], { isSuccess: true, isError: false, isLoading: false }),
    ).toEqual([])
  })

  it('shows rows with alertIds after success', () => {
    expect(
      filterVisibleAlertRows([row], { isSuccess: true, isError: false, isLoading: false }),
    ).toEqual([row])
  })
})

describe('buildAlertRows', () => {
  it('builds rows from summary and attaches alert ids', () => {
    const rows = buildAlertRows(
      [summaryEntry()],
      undefined,
      [stockAlert({ id: 'alert-99' })],
      t,
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.alertIds).toEqual(['alert-99'])
    expect(rows[0]?.level).toBe('out')
  })
})
