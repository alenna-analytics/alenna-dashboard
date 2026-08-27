import { useLocation } from 'react-router-dom'

import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import { shellT } from '@/lib/i18n/shell-strings'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { configurationInnerSubmoduleCrumbs } from '@/pages/configuration/configuration-inner-submodule-crumbs'
import { findActiveConnection } from '@/pages/integrations/dashboard/integration-connection'
import { integrationDetailSlugFromPath } from '@/pages/integrations/dashboard/integrations-inner-nav'
import { cogsBreadcrumbItems } from '@/pages/products/cogs/cogs-breadcrumb-crumbs'
import { useLanguage } from '@/shell/providers/language-provider'
import { useProductDetailQuery } from '@/pages/products/use-catalog-queries'
import { PageBreadcrumb, type PageBreadcrumbItem } from '@/ui/page-breadcrumb'
import { StatusPill } from '@/ui/status-pill'
import { cn } from '@/lib/utils'

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
  if (normalized === '/dashboard/home-v2') {
    return [{ label: shellT(lang, 'navHome') }]
  }
  if (normalized === '/dashboard/reports') {
    return [{ label: shellT(lang, 'navReports') }]
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
  if (normalized === '/dashboard/billing') {
    return [{ label: shellT(lang, 'navBilling') }]
  }
  if (normalized === '/dashboard/team') {
    return [{ label: shellT(lang, 'navTeam') }]
  }
  if (normalized === '/dashboard/team/roles') {
    return [
      { label: shellT(lang, 'navTeam'), to: '/dashboard/team' },
      { label: shellT(lang, 'teamNavRoles') },
    ]
  }
  if (normalized === '/dashboard/configuration/general') {
    return [{ label: shellT(lang, 'navWorkspaceConfiguration') }]
  }
  if (normalized === '/dashboard/configuration/pnl-terms') {
    return [
      {
        label: shellT(lang, 'navWorkspaceConfiguration'),
        to: '/dashboard/configuration/general',
      },
      { label: shellT(lang, 'workspaceConfigPnlTermsTitle') },
    ]
  }
  if (normalized === '/dashboard/alarms') {
    return [{ label: shellT(lang, 'navAlarms') }]
  }
  const alarmCrumbs = configurationInnerSubmoduleCrumbs(normalized, lang)
  if (alarmCrumbs) return alarmCrumbs
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
  if (normalized === '/dashboard/products/cogs') {
    return [{ label: shellT(lang, 'productsNavCogs') }]
  }
  if (normalized === '/dashboard/products/vinculacion') {
    return [{ label: shellT(lang, 'productsNavVinculacion') }]
  }
  if (/^\/dashboard\/products\/vinculacion\/[^/]+$/.test(normalized)) {
    return [
      { label: shellT(lang, 'productsNavVinculacion'), to: '/dashboard/products/vinculacion' },
      { label: shellT(lang, 'productsVinculacionHubCrumb') },
    ]
  }
  const cogsCrumbs = cogsBreadcrumbItems(normalized, lang)
  if (cogsCrumbs) {
    return cogsCrumbs
  }
  if (normalized === '/dashboard/products') {
    return [{ label: shellT(lang, 'navProducts') }]
  }
  if (normalized === '/dashboard/products/bulk-cogs') {
    return [
      { label: shellT(lang, 'navProducts'), to: '/dashboard/products' },
      { label: shellT(lang, 'productsBulkCogsTitle') },
    ]
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
  const connectionsQuery = usePlatformConnectionsQuery()

  const productMatch = pathname.match(/^\/dashboard\/products\/(?!bulk-cogs$)([^/]+)$/)
  const productId = productMatch?.[1]
  const detailQuery = useProductDetailQuery(productId)
  const detail = detailQuery.data

  const items = crumbsForPath(pathname, lang, {
    prefix: shellT(lang, 'productsDetailTitlePrefix'),
    title: detail?.variant_label ?? detail?.title,
    parentId: detail?.parent_product_id ?? undefined,
    parentTitle: detail?.parent_title ?? undefined,
  })

  const integrationSlug = integrationDetailSlugFromPath(pathname)
  const integrationInstalled = Boolean(
    integrationSlug && findActiveConnection(connectionsQuery.data ?? [], integrationSlug),
  )

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <PageBreadcrumb
        items={items}
        ariaLabel={shellT(lang, 'ariaBreadcrumb')}
        className="min-w-0 flex-1"
      />
      {integrationInstalled ? (
        <StatusPill variant="success">{shellT(lang, 'integrationDetailInstalledBadge')}</StatusPill>
      ) : null}
    </div>
  )
}
