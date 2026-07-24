import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { Language } from '@/shell/providers/language-provider'

const INTERNAL_ERROR_PATTERNS: RegExp[] = [
  /greenlet_spawn/i,
  /MissingGreenlet/i,
  /await_only/i,
  /sqlalchemy/i,
  /sqlalche\.me/i,
  /Was IO attempted in an unexpected place/i,
  /\(cursor=/i,
  /orders_processed=/i,
  /page=\d+/i,
]

function looksLikeInternalSyncError(message: string): boolean {
  const trimmed = message.trim()
  if (!trimmed) return false
  return INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(trimmed))
}

export function isPlatformSyncUserCancelled(
  errorCode: string | null | undefined,
  message: string | null | undefined,
): boolean {
  if (errorCode === 'user_cancelled') return true
  const normalized = (message ?? '').trim().toLowerCase()
  return normalized === 'sync cancelled by user.' || normalized === 'sync cancelled by user'
}

export function platformSyncCancelledTitle(lang: Language): string {
  return shellT(lang, 'platformSyncCancelledTitle')
}

export function formatPlatformSyncUserError(
  message: string | null | undefined,
  lang: Language,
  fallbackKey: ShellStringKey,
  errorCode?: string | null,
): string {
  if (isPlatformSyncUserCancelled(errorCode, message)) {
    return shellT(lang, 'platformSyncCancelledBannerMessage')
  }
  if (errorCode === 'worker_died_silently') {
    return shellT(lang, 'platformSyncWorkerDiedMessage')
  }
  if (
    errorCode === 'fx_sync_aborted' ||
    errorCode === 'shopify_sync_fx_aborted' ||
    /failed FX resolution/i.test(message ?? '')
  ) {
    return shellT(lang, 'displayCurrencyPickerNoFxRate')
  }
  const fallback = shellT(lang, fallbackKey)
  if (!message?.trim()) return fallback
  if (looksLikeInternalSyncError(message)) return fallback
  return message.trim()
}
