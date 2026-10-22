import { describe, expect, it } from 'vitest'

import { resolveConnectionLastSuccessfulSyncLine } from '@/lib/integrations/connection-last-sync-display'
import type { PlatformConnection } from '@/lib/types/connectors'

function baseConnection(overrides: Partial<PlatformConnection> = {}): PlatformConnection {
  return {
    id: 'conn-1',
    platform: 'amazon',
    shop_domain: null,
    status: 'active',
    connection_status: 'active',
    last_synced_at: '2026-10-05T18:00:00.000Z',
    last_error: null,
    orders_watermark_at: '2026-10-05T18:00:00.000Z',
    orders_backfill_completed_through: null,
    fees_status: null,
    sync_plan: {
      full_history_window: { start_date: '2023-01-01', end_date: '2026-10-22' },
      last_sync_status: 'synced',
      last_sync_started_at: '2026-10-05T17:00:00.000Z',
      last_sync_completed_at: '2026-10-05T18:00:00.000Z',
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

describe('resolveConnectionLastSuccessfulSyncLine', () => {
  it('returns syncing when current_job_id is set and last status is synced', () => {
    const conn = baseConnection({
      sync_plan: {
        ...baseConnection().sync_plan!,
        last_sync_status: 'synced',
        current_job_id: 'job-123',
      },
    })
    expect(
      resolveConnectionLastSuccessfulSyncLine(conn, {
        nowMs: Date.parse('2026-10-22T18:00:00.000Z'),
      }),
    ).toEqual({ kind: 'syncing' })
  })

  it('returns the age of the last success when there is no current job', () => {
    const conn = baseConnection()
    const line = resolveConnectionLastSuccessfulSyncLine(conn, {
      nowMs: Date.parse('2026-10-22T18:00:00.000Z'),
    })
    expect(line.kind).toBe('relative')
  })
})
