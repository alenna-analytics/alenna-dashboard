import {
  ShopifySyncCooldownError,
  ShopifySyncFailedRetryCapError,
  ShopifySyncInProgressError,
  ShopifySyncTenantBusyError,
  type ShopifySyncTypedError,
} from '@/lib/types/connectors'

export type ApiErrorPayload = {
  code: string | null
  message: string | null
  retryAfterSeconds: number | null
  retryAfterAt: string | null
}

export function readRetryAfterSeconds(res: Response): number | null {
  const raw = res.headers.get('Retry-After')
  if (!raw) return null
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

function parseDetailObject(detail: Record<string, unknown>): ApiErrorPayload {
  const code = typeof detail.code === 'string' ? detail.code : null
  const message = typeof detail.message === 'string' ? detail.message : null
  const retryRaw = detail.retry_after_seconds
  let retryAfterSeconds: number | null = null
  if (typeof retryRaw === 'number' && Number.isFinite(retryRaw) && retryRaw >= 0) {
    retryAfterSeconds = Math.floor(retryRaw)
  } else if (typeof retryRaw === 'string') {
    const parsed = Number.parseInt(retryRaw, 10)
    if (!Number.isNaN(parsed) && parsed >= 0) retryAfterSeconds = parsed
  }
  const retryAfterAt = typeof detail.retry_after_at === 'string' ? detail.retry_after_at : null
  return { code, message, retryAfterSeconds, retryAfterAt }
}

/**
 * Parse API error JSON for both string and structured ``detail`` shapes.
 * Prefer body ``retry_after_seconds`` over the ``Retry-After`` header when present.
 */
export async function parseApiErrorPayload(
  res: Response,
  headerRetryAfter: number | null = readRetryAfterSeconds(res),
): Promise<ApiErrorPayload> {
  const text = await res.text()
  if (!text) {
    return { code: null, message: null, retryAfterSeconds: headerRetryAfter, retryAfterAt: null }
  }
  try {
    const parsed = JSON.parse(text) as unknown
    if (parsed && typeof parsed === 'object' && 'detail' in parsed) {
      const detail = (parsed as { detail: unknown }).detail
      if (typeof detail === 'string') {
        return {
          code: detail,
          message: detail,
          retryAfterSeconds: headerRetryAfter,
          retryAfterAt: null,
        }
      }
      if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
        const fromBody = parseDetailObject(detail as Record<string, unknown>)
        return {
          ...fromBody,
          retryAfterSeconds: fromBody.retryAfterSeconds ?? headerRetryAfter,
        }
      }
    }
  } catch {
    /* not json */
  }
  return {
    code: null,
    message: text,
    retryAfterSeconds: headerRetryAfter,
    retryAfterAt: null,
  }
}

/** User-facing detail string for toasts; never dumps raw structured JSON. */
export async function readApiErrorDetail(res: Response): Promise<string | null> {
  const payload = await parseApiErrorPayload(res)
  return payload.message ?? payload.code
}

export function buildPlatformFullSyncTypedError(
  status: number,
  detail: string | null,
  retryAfterSeconds: number | null,
): ShopifySyncTypedError | null {
  if (status === 409 && detail === 'platform_full_sync_in_progress') {
    return new ShopifySyncInProgressError()
  }
  if (status === 409 && detail === 'platform_full_sync_tenant_busy') {
    return new ShopifySyncTenantBusyError()
  }
  if (status === 429 && detail === 'platform_full_sync_cooldown') {
    return new ShopifySyncCooldownError(retryAfterSeconds)
  }
  if (status === 429 && detail === 'platform_full_sync_failed_retry_cap') {
    return new ShopifySyncFailedRetryCapError(retryAfterSeconds)
  }
  return null
}

export function secondsToCeilHours(seconds: number | null): number {
  if (seconds == null || seconds <= 0) return 0
  return Math.max(1, Math.ceil(seconds / 3600))
}

/** Prefer minutes when less than an hour so toast never shows "0h". */
export function formatRetryAfterHoursLabel(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return '0'
  if (seconds < 3600) {
    const mins = Math.max(1, Math.ceil(seconds / 60))
    return `<1 (${mins}m)`
  }
  return String(Math.max(1, Math.ceil(seconds / 3600)))
}
