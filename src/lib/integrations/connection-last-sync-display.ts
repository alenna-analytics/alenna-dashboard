import { deriveSyncFreshnessAgeDisplay } from '@/lib/integrations/sync-freshness-age'
import type { SyncFreshnessPillTiming } from '@/lib/integrations/sync-freshness-age'
import { isStaleSyncingPlan } from '@/lib/integrations/sync-freshness'
import type { PlatformConnection } from '@/lib/types/connectors'

export type ConnectionLastSyncLine =
  | { kind: 'syncing' }
  | { kind: 'never' }
  | { kind: 'relative'; timing: SyncFreshnessPillTiming }

/** Last successful platform sync (`last_synced_at` is only set after success). */
export function resolveConnectionLastSuccessfulSyncLine(
  conn: PlatformConnection,
  options?: { nowMs?: number },
): ConnectionLastSyncLine {
  const plan = conn.sync_plan
  if (plan?.last_sync_status === 'syncing' && !isStaleSyncingPlan(conn)) {
    return { kind: 'syncing' }
  }

  const last = conn.last_synced_at
  if (!last) {
    return { kind: 'never' }
  }

  const ms = new Date(last).getTime()
  if (Number.isNaN(ms)) {
    return { kind: 'never' }
  }

  const now = options?.nowMs ?? Date.now()
  return {
    kind: 'relative',
    timing: deriveSyncFreshnessAgeDisplay(now - ms),
  }
}

export function connectionDisplaySubtitle(conn: PlatformConnection): string | null {
  const raw = conn.shop_domain?.trim()
  return raw && raw.length > 0 ? raw : null
}
