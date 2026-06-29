import { useNavigate } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'

import { CogsEntryCard } from './cogs-entry-card'
import { useCogsLoadsQuery } from './use-cogs-load-queries'

export function CogsHubPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const t = (key: Parameters<typeof shellT>[1]) => shellT(lang, key)
  const loadsQuery = useCogsLoadsQuery()
  const loadCount = loadsQuery.data?.items.length ?? 0

  const bulkMeta =
    loadsQuery.isSuccess && loadCount > 0
      ? t('productsCogsHubBulkMeta').replace('{count}', String(loadCount))
      : undefined

  return (
    <DashboardPage className="flex flex-1 flex-col gap-6">
      <header className="max-w-2xl space-y-2">
        <h1 className={pageTitleClassName}>{t('productsCogsHubTitle')}</h1>
        <p className="text-sm text-text-secondary">{t('productsCogsHubSubtitle')}</p>
      </header>

      <section className="grid w-full gap-3">
        <CogsEntryCard
          lang={lang}
          icon="download"
          titleKey="productsCogsNavBulkLoad"
          descriptionKey="productsCogsHubBulkDescription"
          actionKey="productsCogsHubOpen"
          meta={bulkMeta}
          onAction={() => void navigate('/dashboard/products/cogs/loads')}
        />
        <CogsEntryCard
          lang={lang}
          icon="integrations"
          titleKey="productsCogsNavPlatformSync"
          descriptionKey="productsCogsHubSyncDescription"
          actionKey="productsCogsHubOpen"
          onAction={() => void navigate('/dashboard/products/cogs/sync')}
        />
      </section>
    </DashboardPage>
  )
}
