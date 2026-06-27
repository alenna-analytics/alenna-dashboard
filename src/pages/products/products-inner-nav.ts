import { matchPath } from 'react-router-dom'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'

export const PRODUCTS_BASE_PATH = '/dashboard/products'

export type ProductsNavItemId = 'catalog' | 'cogs'

export type ProductsNavItem = {
  id: ProductsNavItemId
  path: string
  labelKey: ShellStringKey
}

export const PRODUCTS_INNER_NAV: ProductsNavItem[] = [
  { id: 'catalog', path: PRODUCTS_BASE_PATH, labelKey: 'productsNavCatalog' },
  { id: 'cogs', path: `${PRODUCTS_BASE_PATH}/cogs`, labelKey: 'productsNavCogs' },
]

export function isProductsRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/'
  return (
    normalized === PRODUCTS_BASE_PATH ||
    normalized.startsWith(`${PRODUCTS_BASE_PATH}/`)
  )
}

export function isProductsNavItemActive(item: ProductsNavItem, pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/'
  if (item.id === 'catalog') {
    if (normalized === PRODUCTS_BASE_PATH) return true
    const detail = matchPath({ path: `${PRODUCTS_BASE_PATH}/:productId`, end: true }, normalized)
    if (detail?.params.productId && detail.params.productId !== 'cogs') return true
    return false
  }
  return normalized === item.path || normalized.startsWith(`${item.path}/`)
}
