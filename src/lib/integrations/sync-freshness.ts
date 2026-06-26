import type { SyncFreshnessPillTiming } from '@/lib/integrations/sync-freshness-age'
import { deriveSyncFreshnessAgeDisplay } from '@/lib/integrations/sync-freshness-age'
import type { PlatformConnection, SyncPlanStatus } from '@/lib/types/connectors'

/** After this age, incremental sync is considered stale (default 5m tick × 3). */
export const SYNC_STALE_AFTER_MS = 15 * 60 * 1000

export type SyncFreshnessState = 'syncing' | 'up_to_date' | 'outdated'

export type DeriveSyncFreshnessOptions = {
  forceSyncing?: boolean
  nowMs?: number
  staleAfterMs?: number
}

function isActiveShopifyConnection(conn: PlatformConnection): boolean {
  return (
    conn.platform === 'shopify' &&
    conn.status === 'active' &&
    conn.connection_status === 'active'
  )
}

export function isStaleSyncingPlan(conn: PlatformConnection): boolean {
  const plan = conn.sync_plan
  if (!plan || plan.last_sync_status !== 'syncing') return false
  if (plan.current_job_id) return false
  if (plan.last_sync_completed_at) return true
  const started = plan.last_sync_started_at
  if (!started) return true
  const age = Date.now() - new Date(started).getTime()
  return Number.isNaN(age) || age > SYNC_STALE_AFTER_MS
}

function hasCompletedInitialSync(conn: PlatformConnection): boolean {
  if (conn.orders_watermark_at) return true
  if (conn.orders_backfill_completed_through) return true
  const status: SyncPlanStatus | undefined = conn.sync_plan?.last_sync_status
  return status === 'synced' || status === 'partial'
}

export function deriveConnectionSyncFreshness(
  conn: PlatformConnection | null | undefined,
  options?: DeriveSyncFreshnessOptions,
): SyncFreshnessState | null {
  if (!conn || !isActiveShopifyConnection(conn)) return null

  if (options?.forceSyncing) return 'syncing'
  if (conn.sync_plan?.last_sync_status === 'syncing' && !isStaleSyncingPlan(conn)) {
    return 'syncing'
  }

  if (!hasCompletedInitialSync(conn)) {
    return 'outdated'
  }

  const planStatus = conn.sync_plan?.last_sync_status
  if (planStatus === 'failed' || planStatus === 'not_synced') {
    return 'outdated'
  }

  const last = conn.last_synced_at
  if (!last) {
    return 'outdated'
  }

  const now = options?.nowMs ?? Date.now()
  const staleMs = options?.staleAfterMs ?? SYNC_STALE_AFTER_MS
  const age = now - new Date(last).getTime()
  if (Number.isNaN(age) || age > staleMs) {
    return 'outdated'
  }

  return 'up_to_date'
}

export function aggregateShopifySyncFreshness(
  connections: PlatformConnection[],
  options?: DeriveSyncFreshnessOptions,
): SyncFreshnessState | null {
  const shopify = connections.filter(isActiveShopifyConnection)
  if (shopify.length === 0) return null

  const states = shopify.map((c) => deriveConnectionSyncFreshness(c, options))
  if (states.some((s) => s === 'syncing')) return 'syncing'
  if (states.some((s) => s === 'outdated')) return 'outdated'
  if (states.every((s) => s === 'up_to_date')) return 'up_to_date'
  return 'outdated'
}

export function connectorsQueryRefetchIntervalMs(
  connections: PlatformConnection[] | undefined,
  options?: DeriveSyncFreshnessOptions,
): number | false {
  if (!connections?.length) return false
  const state = aggregateShopifySyncFreshness(connections, options)
  return state === 'syncing' ? 15_000 : false
}

export type SyncFreshnessPillContent =
  | { kind: 'syncing'; freshnessState: SyncFreshnessState }
  | (SyncFreshnessPillTiming & { freshnessState: SyncFreshnessState })

function latestSyncedAtMs(connections: PlatformConnection[]): number | null {
  let latest: number | null = null
  for (const conn of connections) {
    const last = conn.last_synced_at
    if (!last) continue
    const ms = new Date(last).getTime()
    if (Number.isNaN(ms)) continue
    latest = latest === null ? ms : Math.max(latest, ms)
  }
  return latest
}

/** Header pill label source; aggregates all active Shopify connections. */
export function resolveSyncFreshnessPillContent(
  connections: PlatformConnection[],
  options?: DeriveSyncFreshnessOptions,
): SyncFreshnessPillContent | null {
  const shopify = connections.filter(isActiveShopifyConnection)
  if (shopify.length === 0) return null

  const freshnessState = aggregateShopifySyncFreshness(connections, options)
  if (!freshnessState) return null

  if (freshnessState === 'syncing') {
    return { kind: 'syncing', freshnessState }
  }

  const latestMs = latestSyncedAtMs(shopify)
  if (latestMs === null) return null

  const now = options?.nowMs ?? Date.now()
  const ageMs = now - latestMs
  return { ...deriveSyncFreshnessAgeDisplay(ageMs), freshnessState }
}

/** Per-connection pill (integration card / manage sheet). */
export function resolveConnectionSyncFreshnessPillContent(
  conn: PlatformConnection | null | undefined,
  options?: DeriveSyncFreshnessOptions,
): SyncFreshnessPillContent | null {
  if (!conn || !isActiveShopifyConnection(conn)) return null

  const freshnessState = deriveConnectionSyncFreshness(conn, options)
  if (!freshnessState) return null

  if (freshnessState === 'syncing') {
    return { kind: 'syncing', freshnessState }
  }

  const last = conn.last_synced_at
  if (!last) return null

  const ms = new Date(last).getTime()
  if (Number.isNaN(ms)) return null

  const now = options?.nowMs ?? Date.now()
  const ageMs = now - ms
  return { ...deriveSyncFreshnessAgeDisplay(ageMs), freshnessState }
}

export function syncFreshnessPillBadgeVariant(
  pill: SyncFreshnessPillContent,
): 'success' | 'info' | 'warning' {
  if (pill.kind === 'syncing' || pill.freshnessState === 'syncing') return 'info'
  if (pill.freshnessState === 'outdated') return 'warning'
  return 'success'
}
