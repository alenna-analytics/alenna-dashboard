import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { shellT } from '@/lib/i18n/shell-strings'

export function integrationTitle(lang: string, i: ManagedIntegration): string {
  return i.nameKey ? shellT(lang, i.nameKey) : i.catalogName
}

export function integrationDescription(lang: string, i: ManagedIntegration): string {
  return i.shortDescKey ? shellT(lang, i.shortDescKey) : ''
}

export function integrationCategory(lang: string, i: ManagedIntegration): string {
  return i.categoryKey ? shellT(lang, i.categoryKey) : ''
}
