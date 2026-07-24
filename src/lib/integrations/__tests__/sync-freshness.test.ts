import { describe, expect, it } from 'vitest'

import {
  CONNECTORS_SYNC_ACTIVE_REFETCH_MS,
  CONNECTORS_SYNC_BASELINE_REFETCH_MS,
  connectorsQueryRefetchIntervalMs,
  deriveConnectionSyncFreshness,
} from '@/lib/integrations/sync-freshness'
import type { PlatformConnection } from '@/lib/types/connectors'

function baseConnection(overrides: Partial<PlatformConnection> = {}): PlatformConnection {
  return {
    id: 'conn-1',
    platform: 'shopify',
    shop_domain: 'demo.myshopify.com',
    status: 'active',
    connection_status: 'active',
    last_synced_at: '2026-01-01T12:00:00.000Z',
    last_error: null,
    orders_watermark_at: '2026-01-01T12:00:00.000Z',
    orders_backfill_completed_through: null,
    fees_status: null,
    sync_plan: {
      full_history_window: { start_date: '2020-01-01', end_date: '2026-01-01' },
      last_sync_status: 'synced',
      last_sync_started_at: null,
      last_sync_completed_at: '2026-01-01T12:00:00.000Z',
      last_sync_records_count: 10,
      last_sync_records_touched_count: 10,
      failed_attempts_since_last_success: 0,
      actual_min_created_at: null,
      actual_max_created_at: null,
      retry_after_seconds: null,
      cooldown_reason: null,
      current_job_id: null,
    },
    ...overrides,
  }
}

describe('deriveConnectionSyncFreshness', () => {
  it('returns syncing when current_job_id is set without last_sync_status syncing', () => {
    const conn = baseConnection({
      sync_plan: {
        ...baseConnection().sync_plan!,
        last_sync_status: 'synced',
        current_job_id: 'job-123',
      },
    })
    expect(deriveConnectionSyncFreshness(conn)).toBe('syncing')
  })
})

describe('connectorsQueryRefetchIntervalMs', () => {
  it('returns active interval when a connection is syncing via current_job_id', () => {
    const connections = [
      baseConnection({
        sync_plan: {
          ...baseConnection().sync_plan!,
          last_sync_status: 'synced',
          current_job_id: 'job-123',
        },
      }),
    ]
    expect(connectorsQueryRefetchIntervalMs(connections)).toBe(CONNECTORS_SYNC_ACTIVE_REFETCH_MS)
  })

  it('returns active interval when Amazon connection is syncing', () => {
    const connections = [
      baseConnection({
        platform: 'amazon',
        shop_domain: null,
        sync_plan: {
          ...baseConnection().sync_plan!,
          last_sync_status: 'synced',
          current_job_id: 'job-amazon',
        },
      }),
    ]
    expect(connectorsQueryRefetchIntervalMs(connections)).toBe(CONNECTORS_SYNC_ACTIVE_REFETCH_MS)
  })

  it('returns baseline interval for syncable connections without active sync', () => {
    expect(connectorsQueryRefetchIntervalMs([baseConnection()])).toBe(
      CONNECTORS_SYNC_BASELINE_REFETCH_MS,
    )
  })

  it('returns false when there are no syncable connections', () => {
    expect(
      connectorsQueryRefetchIntervalMs([
        baseConnection({ status: 'inactive', connection_status: 'inactive' }),
      ]),
    ).toBe(false)
  })
})
