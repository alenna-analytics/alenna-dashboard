import { describe, expect, it } from 'vitest'

import type { AlertItemApi } from '@/lib/types/alerts'

import {
  activeAlertsDisplayCount,
  alertChannelName,
  alertPlatformSlug,
  alertProductChannelLine,
  alertProductTitle,
} from '../alert-display'

const listingId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

function stockAlert(overrides: Partial<AlertItemApi> = {}): AlertItemApi {
  return {
    id: 'alert-1',
    alert_type: 'stock',
    severity: 'critical',
    title: 'Gatunflas 1kg',
    triggered_at: '2026-08-06T12:00:00Z',
    postponed_until: null,
    platform_connection_id: 'conn-1',
    entity_type: 'product_listing',
    entity_id: listingId,
    product_id: '11111111-1111-1111-1111-111111111111',
    platform: 'amazon',
    platform_sku: 'B0ABC123',
    payload: {},
    ...overrides,
  }
}

describe('alertPlatformSlug', () => {
  it('prefers the listing platform on the alert', () => {
    expect(alertPlatformSlug(stockAlert(), new Map([['conn-1', 'shopify']]))).toBe('amazon')
  })

  it('falls back to the connection platform map', () => {
    expect(
      alertPlatformSlug(
        stockAlert({ platform: null }),
        new Map([['conn-1', 'mercadolibre']]),
      ),
    ).toBe('mercadolibre')
  })
})

describe('alertChannelName', () => {
  it('returns the ecommerce channel for the linked listing', () => {
    expect(alertChannelName(stockAlert(), new Map(), (key) => key)).toBe('integrationNameAmazon')
  })
})

describe('alertProductTitle', () => {
  it('uses the product title and falls back to entity type', () => {
    expect(alertProductTitle(stockAlert())).toBe('Gatunflas 1kg')
    expect(alertProductTitle(stockAlert({ title: '  ' }))).toBe('product_listing')
  })
})

describe('alertProductChannelLine', () => {
  it('puts the channel before the product', () => {
    expect(alertProductChannelLine(stockAlert(), 'Shopify')).toBe('Shopify · Gatunflas 1kg')
  })
})

describe('activeAlertsDisplayCount', () => {
  it('prefers total_active when present', () => {
    expect(
      activeAlertsDisplayCount({
        total_active: 50,
        critical_count: 40,
        low_count: 9,
        informational_count: 1,
      }),
    ).toBe(50)
  })

  it('includes informational alerts when total_active is missing', () => {
    expect(
      activeAlertsDisplayCount({
        critical_count: 40,
        low_count: 9,
        informational_count: 1,
      }),
    ).toBe(50)
  })

  it('treats a zero total as empty', () => {
    expect(activeAlertsDisplayCount({ total_active: 0, critical_count: 3 })).toBe(0)
  })
})
