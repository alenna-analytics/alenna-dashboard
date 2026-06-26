import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { shellT } from '@/lib/i18n/shell-strings'
import type { PlatformConnection } from '@/lib/types/connectors'

export function connectionLabel(
  lang: string,
  connection: Pick<PlatformConnection, 'platform' | 'shop_domain'>,
): string {
  const ui = INTEGRATION_UI[connection.platform]
  if (ui) return shellT(lang, ui.nameKey)
  return connection.shop_domain?.trim() || connection.platform
}
