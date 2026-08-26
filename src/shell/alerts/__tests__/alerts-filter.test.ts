import { describe, expect, it } from 'vitest'

import type { AlertItemApi } from '@/lib/types/alerts'

import {
  countActiveAlertsFilters,
  DEFAULT_ALERTS_LIST_FILTERS,
  filterAlertsByListFilters,
  uniqueAlertChannelSlugs,
  type AlertsListFilters,
} from '../alerts-filter'

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

function filters(patch: Partial<AlertsListFilters> = {}): AlertsListFilters {
  return { ...DEFAULT_ALERTS_LIST_FILTERS, ...patch }
}

describe('uniqueAlertChannelSlugs', () => {
  it('includes connected ecommerce channels and listing platforms', () => {
    expect(
      uniqueAlertChannelSlugs(
        [stockAlert({ platform: 'shopify' })],
        new Map([
          ['conn-1', 'amazon'],
          ['conn-ads', 'amazon_ads'],
        ]),
      ),
    ).toEqual(['amazon', 'shopify'])
  })

  it('skips ads platforms', () => {
    expect(
      uniqueAlertChannelSlugs(
        [stockAlert({ platform: 'amazon_ads' })],
        new Map([['conn-ads', 'amazon_ads']]),
      ),
    ).toEqual([])
  })
})

describe('filterAlertsByListFilters', () => {
  const connections = new Map([
    ['conn-1', 'amazon'],
    ['conn-2', 'shopify'],
  ])

  it('keeps alerts whose listing channel matches', () => {
    const items = [
      stockAlert({ id: 'a', platform: 'amazon' }),
      stockAlert({ id: 's', platform: 'shopify', platform_connection_id: 'conn-2' }),
    ]
    expect(filterAlertsByListFilters(items, filters({ channel: 'shopify' }), connections).map((item) => item.id)).toEqual([
      's',
    ])
  })

  it('resolves channel from the connection map when platform is missing', () => {
    const items = [
      stockAlert({ id: 'a', platform: null, platform_connection_id: 'conn-1' }),
      stockAlert({ id: 's', platform: null, platform_connection_id: 'conn-2' }),
    ]
    expect(filterAlertsByListFilters(items, filters({ channel: 'amazon' }), connections).map((item) => item.id)).toEqual([
      'a',
    ])
  })

  it('does not filter by channel when the value is all', () => {
    const items = [
      stockAlert({ id: 'a', platform: 'amazon' }),
      stockAlert({ id: 's', platform: 'shopify' }),
    ]
    expect(filterAlertsByListFilters(items, filters(), connections)).toHaveLength(2)
  })

  it('filters match suggestions by payload platforms', () => {
    const items = [
      stockAlert({
        id: 'm',
        alert_type: 'match_suggestion',
        platform: null,
        payload: { platforms: ['shopify', 'mercadolibre'] },
      }),
      stockAlert({ id: 'a', platform: 'amazon' }),
    ]
    expect(
      filterAlertsByListFilters(items, filters({ channel: 'shopify' }), connections).map((item) => item.id),
    ).toEqual(['m'])
  })
})

describe('countActiveAlertsFilters', () => {
  it('counts a selected channel', () => {
    expect(countActiveAlertsFilters(DEFAULT_ALERTS_LIST_FILTERS)).toBe(0)
    expect(countActiveAlertsFilters(filters({ channel: 'amazon' }))).toBe(1)
  })
})
