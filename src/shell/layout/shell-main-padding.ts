import { matchPath } from 'react-router-dom'

import { configurationInnerSubmoduleCrumbs } from '@/pages/configuration/configuration-inner-submodule-crumbs'
import { INTEGRATIONS_BASE_PATH } from '@/pages/integrations/dashboard/integrations-inner-nav'
import { cogsBreadcrumbItems } from '@/pages/products/cogs/cogs-breadcrumb-crumbs'
import { PRODUCTS_BASE_PATH } from '@/pages/products/products-inner-nav'
import { cn } from '@/lib/utils'
import { WORKSPACE_SHELL_COLUMN_CLASS } from '@/shell/layout/workspace-shell-column'

const PRODUCT_DETAIL_EXCLUDED_IDS = new Set(['cogs', 'bulk-cogs', 'vinculacion'])
const INTEGRATION_NAV_SLUGS = new Set(['ecommerce', 'ads'])

export function pathnameHasPageBreadcrumb(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/'

  if (cogsBreadcrumbItems(normalized, 'es') != null) return true
  if (configurationInnerSubmoduleCrumbs(normalized, 'es') != null) return true

  const product = matchPath({ path: `${PRODUCTS_BASE_PATH}/:productId`, end: true }, normalized)
  const productId = product?.params.productId
  if (productId && !PRODUCT_DETAIL_EXCLUDED_IDS.has(productId)) return true

  const integration = matchPath({ path: `${INTEGRATIONS_BASE_PATH}/:slug`, end: true }, normalized)
  const slug = integration?.params.slug
  if (slug && !INTEGRATION_NAV_SLUGS.has(slug)) return true

  return false
}

export function shellMainColumnClassName(pathname: string): string {
  return cn(
    WORKSPACE_SHELL_COLUMN_CLASS,
    'min-h-full pb-3 lg:pb-4',
    pathnameHasPageBreadcrumb(pathname) ? 'pt-5 lg:pt-6' : 'pt-[38px]',
  )
}
