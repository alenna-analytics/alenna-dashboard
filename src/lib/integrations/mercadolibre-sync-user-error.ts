import { formatPlatformSyncUserError } from '@/lib/integrations/platform-sync-user-error'
import { shellT } from '@/lib/i18n/shell-strings'
import type { Language } from '@/shell/providers/language-provider'

const INTERNAL_ERROR_PATTERNS: RegExp[] = [
  /greenlet_spawn/i,
  /MissingGreenlet/i,
  /await_only/i,
  /sqlalchemy/i,
  /orders_processed=/i,
  /orders\/search failed/i,
]

function looksLikeInternalSyncError(message: string): boolean {
  const trimmed = message.trim()
  if (!trimmed) return false
  return INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(trimmed))
}

/** User-safe Mercado Libre sync failure copy; hides worker/ORM internals. */
export function formatMercadoLibreSyncUserError(
  message: string | null | undefined,
  lang: Language,
  errorCode?: string | null,
): string {
  const trimmed = message?.trim() ?? ''
  if (/HTTP 403/i.test(trimmed) || /denied access to orders/i.test(trimmed)) {
    return shellT(lang, 'meliSyncFailedPermissionsMessage')
  }
  const formatted = formatPlatformSyncUserError(
    message,
    lang,
    'meliSyncFailedUserMessage',
    errorCode,
  )
  if (formatted !== shellT(lang, 'meliSyncFailedUserMessage')) return formatted
  if (!trimmed) return formatted
  if (looksLikeInternalSyncError(trimmed)) return formatted
  return trimmed
}
