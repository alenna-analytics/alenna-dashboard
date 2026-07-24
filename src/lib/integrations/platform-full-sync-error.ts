import {
  ShopifySyncCooldownError,
  ShopifySyncFailedRetryCapError,
  ShopifySyncInProgressError,
  ShopifySyncTenantBusyError,
  type ShopifySyncTypedError,
} from '@/lib/types/connectors'

export function readRetryAfterSeconds(res: Response): number | null {
  const raw = res.headers.get('Retry-After')
  if (!raw) return null
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

export async function readApiErrorDetail(res: Response): Promise<string | null> {
  const text = await res.text()
  if (!text) return null
  try {
    const parsed = JSON.parse(text) as unknown
    if (parsed && typeof parsed === 'object' && 'detail' in parsed) {
      const detail = (parsed as { detail: unknown }).detail
      if (typeof detail === 'string') return detail
    }
  } catch {
    /* not json */
  }
  return text
}

export function buildPlatformFullSyncTypedError(
  status: number,
  detail: string | null,
  retryAfterSeconds: number | null,
): ShopifySyncTypedError | null {
  if (status === 409 && detail === 'shopify_full_sync_in_progress') {
    return new ShopifySyncInProgressError()
  }
  if (status === 409 && detail === 'shopify_full_sync_tenant_busy') {
    return new ShopifySyncTenantBusyError()
  }
  if (status === 429 && detail === 'shopify_full_sync_cooldown') {
    return new ShopifySyncCooldownError(retryAfterSeconds)
  }
  if (status === 429 && detail === 'shopify_full_sync_failed_retry_cap') {
    return new ShopifySyncFailedRetryCapError(retryAfterSeconds)
  }
  return null
}

export function secondsToCeilHours(seconds: number | null): number {
  if (seconds == null || seconds <= 0) return 0
  return Math.max(1, Math.ceil(seconds / 3600))
}
