import { matchPath } from 'react-router-dom'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'

export const PRODUCTS_BASE_PATH = '/dashboard/products'
export const PRODUCTS_LINKING_SEGMENT = 'linking'
export const PRODUCTS_LINKING_PATH = `${PRODUCTS_BASE_PATH}/${PRODUCTS_LINKING_SEGMENT}`
export const PRODUCTS_LINKING_LEGACY_SEGMENT = 'vinculacion'

export const PRODUCTS_RESERVED_SEGMENTS = new Set([
  'cogs',
  'bulk-cogs',
  PRODUCTS_LINKING_SEGMENT,
  PRODUCTS_LINKING_LEGACY_SEGMENT,
])

export type ProductsNavItemId = 'catalog' | 'cogs' | 'linking'

export type ProductsNavItem = {
  id: ProductsNavItemId
  path: string
  labelKey: ShellStringKey
}

export const PRODUCTS_INNER_NAV: ProductsNavItem[] = [
  { id: 'catalog', path: PRODUCTS_BASE_PATH, labelKey: 'productsNavCatalog' },
  { id: 'cogs', path: `${PRODUCTS_BASE_PATH}/cogs`, labelKey: 'productsNavCogs' },
  { id: 'linking', path: PRODUCTS_LINKING_PATH, labelKey: 'productsNavVinculacion' },
]

export function productsLinkingGroupPath(groupId: string): string {
  return `${PRODUCTS_LINKING_PATH}/${groupId}`
}

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
    if (detail?.params.productId && !PRODUCTS_RESERVED_SEGMENTS.has(detail.params.productId)) return true
    return false
  }
  return normalized === item.path || normalized.startsWith(`${item.path}/`)
}
