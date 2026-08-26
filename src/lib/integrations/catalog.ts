import type { IntegrationPlatformRow } from '@/lib/types/connectors'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'

import amazonLogo from '@/assets/partners/amazon.svg'
import amazonAdsLogo from '@/assets/partners/amazon_ads.svg'
import googleAdsLogo from '@/assets/partners/google_ads.svg'
import mercadolibreLogo from '@/assets/partners/mercado_libre.svg'
import mercadolibreAdsLogo from '@/assets/partners/mercado_ads.svg'
import metaAdsLogo from '@/assets/partners/meta_ads.svg'
import shopifyLogo from '@/assets/partners/shopify.svg'

type IntegrationUiOverlay = {
  nameKey: ShellStringKey
  shortDescKey: ShellStringKey
  categoryKey: ShellStringKey
  logoSrc: string
  docsUrl: string
}

/** Platform slugs present in the API catalog but not shown in Integrations UI. */
export const HIDDEN_INTEGRATION_SLUGS = new Set(['walmart'])

export function isIntegrationHidden(slug: string): boolean {
  return HIDDEN_INTEGRATION_SLUGS.has(slug)
}

/** Static i18n + logos keyed by platform slug; API rows without an entry use `catalogName` only. */
export const INTEGRATION_UI: Record<string, IntegrationUiOverlay> = {
  shopify: {
    nameKey: 'integrationNameShopify',
    shortDescKey: 'integrationDescShopify',
    categoryKey: 'integrationsCategoryEcommerce',
    logoSrc: shopifyLogo,
    docsUrl: 'https://help.shopify.com/manual',
  },
  amazon: {
    nameKey: 'integrationNameAmazon',
    shortDescKey: 'integrationDescAmazon',
    categoryKey: 'integrationsCategoryEcommerce',
    logoSrc: amazonLogo,
    docsUrl: 'https://developer-docs.amazon.com/sp-api/docs',
  },
  mercadolibre: {
    nameKey: 'integrationNameMercadoLibre',
    shortDescKey: 'integrationDescMercadoLibre',
    categoryKey: 'integrationsCategoryEcommerce',
    logoSrc: mercadolibreLogo,
    docsUrl: 'https://developers.mercadolibre.com.mx/',
  },
  amazon_ads: {
    nameKey: 'integrationNameAmazonAds',
    shortDescKey: 'integrationDescAmazonAds',
    categoryKey: 'integrationsCategoryAds',
    logoSrc: amazonAdsLogo,
    docsUrl: 'https://advertising.amazon.com/API/docs',
  },
  mercadolibre_ads: {
    nameKey: 'integrationNameMercadoLibreAds',
    shortDescKey: 'integrationDescMercadoLibreAds',
    categoryKey: 'integrationsCategoryAds',
    logoSrc: mercadolibreAdsLogo,
    docsUrl: 'https://developers.mercadolibre.com.mx/es_ar/product-ads',
  },
  google_ads: {
    nameKey: 'integrationNameGoogleAds',
    shortDescKey: 'integrationDescGoogleAds',
    categoryKey: 'integrationsCategoryAds',
    logoSrc: googleAdsLogo,
    docsUrl: 'https://developers.google.com/google-ads/api/docs/start',
  },
  meta_ads: {
    nameKey: 'integrationNameMetaAds',
    shortDescKey: 'integrationDescMetaAds',
    categoryKey: 'integrationsCategoryAds',
    logoSrc: metaAdsLogo,
    docsUrl: 'https://developers.facebook.com/docs/marketing-api',
  },
}

export type ManagedIntegration = {
  slug: string
  catalogName: string
  available: boolean
  sortOrder: number
  nameKey?: ShellStringKey
  shortDescKey?: ShellStringKey
  categoryKey?: ShellStringKey
  logoSrc?: string
  docsUrl?: string
}

export function mergeIntegrationPlatform(row: IntegrationPlatformRow): ManagedIntegration {
  const ui = INTEGRATION_UI[row.slug]
  return {
    slug: row.slug,
    catalogName: row.name,
    available: row.is_available,
    sortOrder: row.sort_order,
    nameKey: ui?.nameKey,
    shortDescKey: ui?.shortDescKey,
    categoryKey: ui?.categoryKey,
    logoSrc: ui?.logoSrc,
    docsUrl: ui?.docsUrl,
  }
}
