import type { PlatformConnection } from '@/lib/types/connectors'

export function findActiveConnection(
  connections: PlatformConnection[],
  platform: string,
): PlatformConnection | null {
  return (
    connections.find(
      (c) =>
        c.platform === platform &&
        c.status === 'active' &&
        c.connection_status === 'active',
    ) ?? null
  )
}

export function isIntegrationConnected(
  slug: string,
  shopifyConnected: boolean,
  mercadolibreConnected: boolean,
): boolean {
  if (slug === 'shopify') return shopifyConnected
  if (slug === 'mercadolibre') return mercadolibreConnected
  return false
}
