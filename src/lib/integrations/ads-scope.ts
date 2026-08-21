import type { PlatformConnection } from '@/lib/types/connectors'

const ADS_PLATFORMS = new Set([
  'amazon_ads',
  'mercadolibre_ads',
  'google_ads',
  'meta_ads',
])

export function isAdsPlatform(platform: string): boolean {
  return ADS_PLATFORMS.has(platform)
}

export function isActiveAdsConnection(conn: PlatformConnection): boolean {
  return (
    isAdsPlatform(conn.platform) &&
    conn.status === 'active' &&
    conn.connection_status === 'active'
  )
}

export function filterEcommerceConnections(
  connections: PlatformConnection[],
): PlatformConnection[] {
  return connections.filter((row) => !isAdsPlatform(row.platform))
}

export function filterActiveAdsConnections(
  connections: PlatformConnection[],
): PlatformConnection[] {
  return connections.filter(isActiveAdsConnection)
}

export type AdsApiScope = {
  queryConnectionIds: string[]
  hasAdsConnections: boolean
  adsConnectionIds: string[]
}

export function resolveAdsApiScope(
  connections: PlatformConnection[],
  filterIds?: string[],
): AdsApiScope {
  const adsRows = connections.filter(isActiveAdsConnection)
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

/** Publicidad page: optional subset of ads connection ids (empty = all ads). */
export function resolveAdsPageScope(
  connections: PlatformConnection[],
  selectedAdsConnectionIds?: string[],
): AdsApiScope {
  const adsRows = filterActiveAdsConnections(connections)
  const filterSet =
    selectedAdsConnectionIds && selectedAdsConnectionIds.length > 0
      ? new Set(selectedAdsConnectionIds)
      : null
  const scopedAds =
    filterSet == null ? adsRows : adsRows.filter((row) => filterSet.has(row.id))
  const adsConnectionIds = scopedAds.map((row) => row.id)
  const siblingIds = scopedAds
    .map((row) => row.linked_commerce_connection_id)
    .filter((id): id is string => Boolean(id))
  const queryConnectionIds = [...new Set([...siblingIds, ...adsConnectionIds])]
  return {
    queryConnectionIds,
    hasAdsConnections: adsRows.length > 0,
    adsConnectionIds,
  }
}
