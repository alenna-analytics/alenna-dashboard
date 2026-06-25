import { useLocation } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { useLanguage } from '@/shell/providers/language-provider'
import { useProductDetailQuery } from '@/pages/products/use-catalog-queries'
import { PageBreadcrumb, type PageBreadcrumbItem } from '@/ui/page-breadcrumb'

type Crumb = PageBreadcrumbItem

type ProductDetailCrumb = {
  prefix: string
  title?: string
  parentId?: string
  parentTitle?: string
}

function crumbsForPath(pathname: string, lang: string, productDetail?: ProductDetailCrumb): Crumb[] {
  const normalized = pathname.replace(/\/$/, '') || '/'

  if (normalized === '/dashboard') {
    return [{ label: shellT(lang, 'navHome') }]
  }
  if (normalized === '/dashboard/components') {
    return [
      { label: shellT(lang, 'navHome'), to: '/dashboard' },
      { label: shellT(lang, 'navComponents') },
    ]
  }
  if (normalized === '/dashboard/configuration') {
    return [{ label: shellT(lang, 'navWorkspaceConfiguration') }]
  }
  if (normalized === '/dashboard/configuration/alarms') {
    return [{ label: shellT(lang, 'navWorkspaceConfiguration') }]
  }
  if (normalized === '/dashboard/configuration/alarms/stock') {
    return [
      { label: shellT(lang, 'navWorkspaceConfiguration'), to: '/dashboard/configuration/alarms' },
      { label: shellT(lang, 'alarmsStockTypeTitle') },
    ]
  }
  if (normalized === '/dashboard/integrations') {
    return [{ label: shellT(lang, 'navIntegrations') }]
  }
  if (/^\/dashboard\/integrations\/[^/]+$/.test(normalized)) {
    const slug = normalized.split('/').pop() ?? ''
    const ui = INTEGRATION_UI[slug]
    const label = ui ? shellT(lang, ui.nameKey) : slug
    return [
      { label: shellT(lang, 'navIntegrations'), to: '/dashboard/integrations' },
      { label },
    ]
  }
  if (normalized === '/dashboard/alarms') {
    return [{ label: shellT(lang, 'navAlarms') }]
  }
  if (normalized === '/dashboard/products') {
    return [{ label: shellT(lang, 'navProducts') }]
  }
  if (/^\/dashboard\/products\/[^/]+$/.test(normalized)) {
    const crumbs: Crumb[] = [
      { label: shellT(lang, 'navProducts'), to: '/dashboard/products' },
    ]
    if (productDetail?.parentId && productDetail.parentTitle?.trim()) {
      crumbs.push({
        label: productDetail.parentTitle.trim(),
        to: `/dashboard/products/${productDetail.parentId}`,
      })
      const variantLabel = productDetail.title?.trim() || shellT(lang, 'productsDetailBreadcrumb')
      crumbs.push({ label: variantLabel })
      return crumbs
    }
    const detailLabel =
      productDetail?.title?.trim().length
        ? `${productDetail.prefix} ${productDetail.title.trim()}`
        : shellT(lang, 'productsDetailBreadcrumb')
    crumbs.push({ label: detailLabel })
    return crumbs
  }

  if (normalized.startsWith('/dashboard')) {
    return [{ label: shellT(lang, 'navHome'), to: '/dashboard' }]
  }

  return [{ label: shellT(lang, 'bootBrandName') }]
}

export function AppBreadcrumbs({ className }: { className?: string }) {
  const { pathname } = useLocation()
  const { lang } = useLanguage()

  const productMatch = pathname.match(/^\/dashboard\/products\/([^/]+)$/)
  const productId = productMatch?.[1]
  const detailQuery = useProductDetailQuery(productId)
  const detail = detailQuery.data

  const items = crumbsForPath(pathname, lang, {
    prefix: shellT(lang, 'productsDetailTitlePrefix'),
    title: detail?.variant_label ?? detail?.title,
    parentId: detail?.parent_product_id ?? undefined,
    parentTitle: detail?.parent_title ?? undefined,
  })

  return (
    <PageBreadcrumb
      items={items}
      ariaLabel={shellT(lang, 'ariaBreadcrumb')}
      className={className}
    />
  )
}
