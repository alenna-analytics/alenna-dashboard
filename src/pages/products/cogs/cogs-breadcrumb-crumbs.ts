import { shellT } from '@/lib/i18n/shell-strings'
import type { PageBreadcrumbItem } from '@/ui/page-breadcrumb'

const COGS_BASE = '/dashboard/products/cogs'

export function cogsBreadcrumbItems(pathname: string, lang: string): PageBreadcrumbItem[] | null {
  const normalized = pathname.replace(/\/$/, '') || '/'
  const cogsRoot: PageBreadcrumbItem = { label: shellT(lang, 'productsNavCogs'), to: COGS_BASE }

  if (normalized === COGS_BASE) {
    return null
  }
  if (normalized === `${COGS_BASE}/loads`) {
    return [cogsRoot, { label: shellT(lang, 'productsCogsLoadsTitle') }]
  }
  if (normalized === `${COGS_BASE}/sync`) {
    return [cogsRoot, { label: shellT(lang, 'productsCogsNavPlatformSync') }]
  }
  if (/^\/dashboard\/products\/cogs\/loads\/[^/]+\/view$/.test(normalized)) {
    return [
      cogsRoot,
      { label: shellT(lang, 'productsCogsLoadsTitle'), to: `${COGS_BASE}/loads` },
      { label: shellT(lang, 'productsCogsLoadViewTitle') },
    ]
  }
  if (/^\/dashboard\/products\/cogs\/loads\/[^/]+$/.test(normalized)) {
    return [
      cogsRoot,
      { label: shellT(lang, 'productsCogsLoadsTitle'), to: `${COGS_BASE}/loads` },
      { label: shellT(lang, 'productsCogsLoadEditorBreadcrumb') },
    ]
  }

  return null
}
