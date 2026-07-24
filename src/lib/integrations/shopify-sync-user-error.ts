import { formatPlatformSyncUserError } from '@/lib/integrations/platform-sync-user-error'
import { shellT } from '@/lib/i18n/shell-strings'
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

/** User-safe Shopify sync failure copy; hides worker/ORM internals. */
export function formatShopifySyncUserError(
  message: string | null | undefined,
  lang: Language,
  errorCode?: string | null,
): string {
  const formatted = formatPlatformSyncUserError(
    message,
    lang,
    'shopifySyncFailedUserMessage',
    errorCode,
  )
  if (formatted !== shellT(lang, 'shopifySyncFailedUserMessage')) return formatted
  if (!message?.trim()) return formatted
  if (looksLikeInternalSyncError(message)) return formatted
  return message.trim()
}
