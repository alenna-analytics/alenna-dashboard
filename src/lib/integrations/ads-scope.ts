import type { PlatformConnection } from '@/lib/types/connectors'

const ADS_PLATFORMS = new Set([
  'amazon_ads',
  'mercadolibre_ads',
  'google_ads',
  'meta_ads',
])

export type AdsApiScope = {
  queryConnectionIds: string[]
  hasAdsConnections: boolean
  adsConnectionIds: string[]
}

export function resolveAdsApiScope(
  connections: PlatformConnection[],
  filterIds?: string[],
): AdsApiScope {
  const adsRows = connections.filter(
    (row) => ADS_PLATFORMS.has(row.platform) && row.status === 'active',
  )
  const filterSet = filterIds ? new Set(filterIds) : null
  const scopedAds =
    filterSet == null
      ? adsRows
      : adsRows.filter((row) => {
          const linked = row.linked_commerce_connection_id
          return Boolean(linked && filterSet.has(linked))
        })
  const adsConnectionIds = scopedAds.map((row) => row.id)
  const siblingIds = scopedAds
    .map((row) => row.linked_commerce_connection_id)
    .filter((id): id is string => Boolean(id))
  const queryConnectionIds = [...new Set([...siblingIds, ...adsConnectionIds])]
  return {
    queryConnectionIds,
    hasAdsConnections: adsConnectionIds.length > 0,
    adsConnectionIds,
  }
}
