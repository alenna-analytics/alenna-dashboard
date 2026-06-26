import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { shellT } from '@/lib/i18n/shell-strings'
import { INTEGRATIONS_BASE_PATH } from '@/pages/integrations/dashboard/integrations-inner-nav'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { PageBreadcrumb } from '@/ui/page-breadcrumb'

type IntegrationDetailBreadcrumbProps = {
  slug: string
  className?: string
}

export function IntegrationDetailBreadcrumb({ slug, className }: IntegrationDetailBreadcrumbProps) {
  const { lang } = useLanguage()
  const ui = INTEGRATION_UI[slug]
  const label = ui ? shellT(lang, ui.nameKey) : slug

  return (
    <PageBreadcrumb
      items={[
        { label: shellT(lang, 'navIntegrations'), to: INTEGRATIONS_BASE_PATH },
        { label },
      ]}
      ariaLabel={shellT(lang, 'ariaBreadcrumb')}
      className={cn('mb-2', className)}
    />
  )
}
