import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { PageBreadcrumb } from '@/ui/page-breadcrumb'

type BulkCogsBreadcrumbProps = {
  className?: string
}

export function BulkCogsBreadcrumb({ className }: BulkCogsBreadcrumbProps) {
  const { lang } = useLanguage()

  return (
    <PageBreadcrumb
      className={className}
      ariaLabel={shellT(lang, 'ariaBreadcrumb')}
      items={[
        { label: shellT(lang, 'navProducts'), to: '/dashboard/products' },
        { label: shellT(lang, 'productsBulkCogsTitle') },
      ]}
    />
  )
}
