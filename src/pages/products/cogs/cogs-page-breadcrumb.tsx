import { useLocation } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { PageBreadcrumb } from '@/ui/page-breadcrumb'

import { cogsBreadcrumbItems } from './cogs-breadcrumb-crumbs'

type CogsPageBreadcrumbProps = {
  className?: string
}

export function CogsPageBreadcrumb({ className }: CogsPageBreadcrumbProps) {
  const { pathname } = useLocation()
  const { lang } = useLanguage()
  const items = cogsBreadcrumbItems(pathname, lang)

  if (!items) return null

  return (
    <PageBreadcrumb
      items={items}
      ariaLabel={shellT(lang, 'ariaBreadcrumb')}
      className={cn('mb-2', className)}
    />
  )
}
