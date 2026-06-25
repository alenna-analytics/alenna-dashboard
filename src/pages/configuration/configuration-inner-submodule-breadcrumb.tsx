import { useLocation } from 'react-router-dom'

import { configurationInnerSubmoduleCrumbs } from '@/pages/configuration/configuration-inner-submodule-crumbs'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { PageBreadcrumb } from '@/ui/page-breadcrumb'

type ConfigurationInnerSubmoduleBreadcrumbProps = {
  className?: string
}

export function ConfigurationInnerSubmoduleBreadcrumb({
  className,
}: ConfigurationInnerSubmoduleBreadcrumbProps) {
  const { pathname } = useLocation()
  const { lang } = useLanguage()
  const items = configurationInnerSubmoduleCrumbs(pathname, lang)

  if (!items) return null

  return (
    <PageBreadcrumb
      items={items}
      ariaLabel={shellT(lang, 'ariaBreadcrumb')}
      className={cn('mb-2', className)}
    />
  )
}
