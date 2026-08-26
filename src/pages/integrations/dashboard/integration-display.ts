import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'

export function integrationTitle(lang: string, i: ManagedIntegration): string {
  return i.nameKey ? shellT(lang, i.nameKey) : i.catalogName
}

export function integrationDescription(lang: string, i: ManagedIntegration): string {
  return i.shortDescKey ? shellT(lang, i.shortDescKey) : ''
}

export function integrationCategory(lang: string, i: ManagedIntegration): string {
  return i.categoryKey ? shellT(lang, i.categoryKey) : ''
}

const OVERVIEW_COPY_BY_SLUG: Record<string, ShellStringKey> = {
  shopify: 'integrationDescShopify',
  amazon: 'integrationSheetAmazonConnectIntro',
  mercadolibre: 'integrationDescMercadoLibre',
  amazon_ads: 'integrationDetailAdsHelper',
  mercadolibre_ads: 'integrationDetailAdsHelper',
  google_ads: 'integrationDetailAdsHelper',
  meta_ads: 'integrationDetailAdsHelper',
}

export function integrationOverviewCopy(lang: string, integration: ManagedIntegration): string {
  const key = OVERVIEW_COPY_BY_SLUG[integration.slug]
  if (key) return shellT(lang, key)
  return integrationDescription(lang, integration)
}
