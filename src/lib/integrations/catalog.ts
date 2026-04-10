import type { IntegrationPlatformRow } from '@/lib/types/connectors'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'

import amazonLogo from '@/assets/amazon_logo.png'
import mercadolibreLogo from '@/assets/mercado_libre_logo.png'
import shopifyLogo from '@/assets/shopify_logo.png'
import walmartLogo from '@/assets/walmart_logo.png'

type IntegrationUiOverlay = {
  nameKey: ShellStringKey
  shortDescKey: ShellStringKey
  categoryKey: ShellStringKey
  logoSrc: string
}

/** Static i18n + logos keyed by platform slug; API rows without an entry use `catalogName` only. */
export const INTEGRATION_UI: Record<string, IntegrationUiOverlay> = {
  shopify: {
    nameKey: 'integrationNameShopify',
    shortDescKey: 'integrationDescShopify',
    categoryKey: 'integrationsCategoryEcommerce',
    logoSrc: shopifyLogo,
  },
  amazon: {
    nameKey: 'integrationNameAmazon',
    shortDescKey: 'integrationDescAmazon',
    categoryKey: 'integrationsCategoryEcommerce',
    logoSrc: amazonLogo,
  },
  mercadolibre: {
    nameKey: 'integrationNameMercadoLibre',
    shortDescKey: 'integrationDescMercadoLibre',
    categoryKey: 'integrationsCategoryEcommerce',
    logoSrc: mercadolibreLogo,
  },
  walmart: {
    nameKey: 'integrationNameWalmart',
    shortDescKey: 'integrationDescWalmart',
    categoryKey: 'integrationsCategoryEcommerce',
    logoSrc: walmartLogo,
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
  }
}
