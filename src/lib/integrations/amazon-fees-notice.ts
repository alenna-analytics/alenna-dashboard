import type { PlatformConnection } from '@/lib/types/connectors'

export type AmazonFeesNoticeState = 'none' | 'unavailable' | 'partial'

function selectedAmazonConnections(
  connections: PlatformConnection[],
  activeConnectionIds: string[],
): PlatformConnection[] {
  if (connections.length === 0) return []
  const selected =
    activeConnectionIds.length > 0
      ? new Set(activeConnectionIds)
      : new Set(connections.map((c) => c.id))
  return connections.filter(
    (c) =>
      selected.has(c.id) &&
      c.platform === 'amazon' &&
      c.status === 'active' &&
      c.connection_status === 'active',
  )
}

export function resolveAmazonFeesNoticeState(
  connections: PlatformConnection[],
  activeConnectionIds: string[],
): AmazonFeesNoticeState {
  const amazon = selectedAmazonConnections(connections, activeConnectionIds)
  if (amazon.length === 0) return 'none'
  if (amazon.some((c) => c.fees_status === 'unavailable')) return 'unavailable'
  if (amazon.some((c) => c.fees_status === 'partial')) return 'partial'
  return 'none'
}

/** @deprecated Prefer resolveAmazonFeesNoticeState */
export function includesAmazonWithUnavailableFees(
  connections: PlatformConnection[],
  activeConnectionIds: string[],
): boolean {
  return resolveAmazonFeesNoticeState(connections, activeConnectionIds) !== 'none'
}

export function amazonFeesNoticeStateFromConnection(
  connection: PlatformConnection | null | undefined,
): AmazonFeesNoticeState {
  if (
    !connection ||
    connection.platform !== 'amazon' ||
    connection.status !== 'active' ||
    connection.connection_status !== 'active'
  ) {
    return 'none'
  }
  if (connection.fees_status === 'unavailable') return 'unavailable'
  if (connection.fees_status === 'partial') return 'partial'
  return 'none'
}
