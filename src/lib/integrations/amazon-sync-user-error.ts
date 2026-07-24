import {
  formatPlatformSyncUserError,
  isPlatformSyncUserCancelled,
  platformSyncCancelledTitle,
} from '@/lib/integrations/platform-sync-user-error'
import { shellT } from '@/lib/i18n/shell-strings'
import type { Language } from '@/shell/providers/language-provider'

export function formatAmazonSyncUserError(
  message: string | null | undefined,
  lang: Language,
  errorCode?: string | null,
): string {
  if (/HTTP 403/i.test(message ?? '') || /denied access to orders/i.test(message ?? '')) {
    return shellT(lang, 'amazonSyncFailedPermissionsMessage')
  }
  return formatPlatformSyncUserError(
    message,
    lang,
    'amazonSyncFailedUserMessage',
    errorCode,
  )
}

export function amazonSyncFailedTitle(
  lang: Language,
  errorCode?: string | null,
  message?: string | null,
): string {
  if (isPlatformSyncUserCancelled(errorCode, message)) {
    return platformSyncCancelledTitle(lang)
  }
  return shellT(lang, 'amazonSyncFailedTitle')
}

export function formatAmazonConnectUserError(_error: unknown, lang: Language): string {
  return shellT(lang, 'integrationAmazonConnectFailed')
}

export function formatAmazonDisconnectUserError(
  _error: unknown,
  lang: Language,
): string {
  return shellT(lang, 'integrationAmazonDisconnectFailed')
}
