import type { ShellStringKey } from '@/lib/shell-strings'

import amazonLogo from '@/assets/amazon_logo.png'
import mercadolibreLogo from '@/assets/mercado_libre_logo.png'
import shopifyLogo from '@/assets/shopify_logo.png'
import walmartLogo from '@/assets/walmart_logo.png'

export type IntegrationSlug = 'shopify' | 'amazon' | 'mercadolibre' | 'walmart'

/** Maps to `platform_connections.platform` when wired; null = catalog-only (coming soon). */
export type PlatformKey = 'shopify' | 'amazon' | 'mercadolibre' | 'walmart' | null

export type IntegrationDefinition = {
  slug: IntegrationSlug
  platform: PlatformKey
  nameKey: ShellStringKey
  shortDescKey: ShellStringKey
  categoryKey: ShellStringKey
  logoSrc: string
  available: boolean
}

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    slug: 'shopify',
    platform: 'shopify',
    nameKey: 'integrationNameShopify',
    shortDescKey: 'integrationDescShopify',
    categoryKey: 'integrationsCategoryEcommerce',
    logoSrc: shopifyLogo,
    available: true,
  },
  {
    slug: 'amazon',
    platform: 'amazon',
    nameKey: 'integrationNameAmazon',
    shortDescKey: 'integrationDescAmazon',
    categoryKey: 'integrationsCategoryEcommerce',
    logoSrc: amazonLogo,
    available: false,
  },
  {
    slug: 'mercadolibre',
    platform: 'mercadolibre',
    nameKey: 'integrationNameMercadoLibre',
    shortDescKey: 'integrationDescMercadoLibre',
    categoryKey: 'integrationsCategoryEcommerce',
    logoSrc: mercadolibreLogo,
    available: false,
  },
  {
    slug: 'walmart',
    platform: 'walmart',
    nameKey: 'integrationNameWalmart',
    shortDescKey: 'integrationDescWalmart',
    categoryKey: 'integrationsCategoryEcommerce',
    logoSrc: walmartLogo,
    available: false,
  },
]

export function getIntegrationBySlug(slug: string): IntegrationDefinition | undefined {
  return INTEGRATIONS.find((i) => i.slug === slug)
}
