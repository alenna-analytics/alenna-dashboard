import type { PlatformConnection } from '@/lib/types/connectors'
import { connectionNeedsInitialSync } from '@/lib/integrations/sync-freshness'

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

export function resolveIntegrationConnection(
  slug: string,
  connections: PlatformConnection[],
): PlatformConnection | null {
  if (slug === 'shopify') return findActiveConnection(connections, 'shopify')
  if (slug === 'mercadolibre') return findActiveConnection(connections, 'mercadolibre')
  return null
}

export function integrationNeedsInitialSync(
  slug: string,
  connections: PlatformConnection[],
): boolean {
  return connectionNeedsInitialSync(resolveIntegrationConnection(slug, connections))
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
