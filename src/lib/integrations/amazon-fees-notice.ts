import type { PlatformConnection } from '@/lib/types/connectors'

export function includesAmazonWithUnavailableFees(
  connections: PlatformConnection[],
  activeConnectionIds: string[],
): boolean {
  if (connections.length === 0) return false
  const selected =
    activeConnectionIds.length > 0
      ? new Set(activeConnectionIds)
      : new Set(connections.map((c) => c.id))
  return connections.some(
    (c) =>
      selected.has(c.id) &&
      c.platform === 'amazon' &&
      c.status === 'active' &&
      c.connection_status === 'active' &&
      (c.fees_status === 'unavailable' || c.fees_status === 'partial'),
  )
}
