import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { useProductDetailQuery } from '@/pages/products/use-catalog-queries'
import { cn } from '@/lib/utils'

type Crumb = {
  label: string
  to?: string
}

type ProductDetailCrumb = {
  prefix: string
  title?: string
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
  if (normalized === '/dashboard/reports') {
    return [{ label: shellT(lang, 'navReports') }]
  }
  if (normalized === '/dashboard/integrations') {
    return [{ label: shellT(lang, 'navIntegrations') }]
  }
  if (normalized === '/dashboard/products') {
    return [{ label: shellT(lang, 'navProducts') }]
  }
  if (/^\/dashboard\/products\/[^/]+$/.test(normalized)) {
    const detailLabel =
      productDetail?.title?.trim().length
        ? `${productDetail.prefix} ${productDetail.title.trim()}`
        : shellT(lang, 'productsDetailBreadcrumb')
    return [
      { label: shellT(lang, 'navProducts'), to: '/dashboard/products' },
      { label: detailLabel },
    ]
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
  const productTitle = productId ? detailQuery.data?.title : undefined

  const items = crumbsForPath(pathname, lang, {
    prefix: shellT(lang, 'productsDetailTitlePrefix'),
    title: productTitle,
  })

  return (
    <nav aria-label={shellT(lang, 'ariaBreadcrumb')} className={cn('min-w-0', className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-text-secondary">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {i > 0 ? (
                <ChevronRight
                  className="size-3.5 shrink-0 text-text-tertiary"
                  aria-hidden
                />
              ) : null}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="truncate font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'truncate font-medium',
                    isLast ? 'text-text-primary' : 'text-text-secondary',
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
