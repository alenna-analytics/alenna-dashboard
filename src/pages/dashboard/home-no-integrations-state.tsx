import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import { IntegrationCardSkeleton } from '@/pages/integrations/dashboard/integration-card-skeleton'
import { IntegrationListCard } from '@/pages/integrations/dashboard/integration-list-card'
import { useIntegrationsListQueries } from '@/pages/integrations/hooks/use-integrations-list-queries'
import { pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useWorkspace } from '@/shell/providers/workspace-context'

type HomeNoIntegrationsStateProps = {
  lang: string
}

export function HomeNoIntegrationsState({ lang }: HomeNoIntegrationsStateProps) {
  const { me } = useWorkspace()
  const { integrations, pageLoading } = useIntegrationsListQueries()

  const sortedIntegrations = useMemo(
    () =>
      [...integrations].sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1
        return a.sortOrder - b.sortOrder
      }),
    [integrations],
  )

  const firstName = me?.first_name?.trim()
  const title = firstName
    ? shellT(lang, 'homeNoIntegrationsTitleNamed', { name: firstName })
    : shellT(lang, 'homeNoIntegrationsTitle')

  return (
    <div className="space-y-8">
      <section>
        <div className="max-w-2xl">
          <h1 className={pageTitleClassName}>{title}</h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            {shellT(lang, 'homeNoIntegrationsDescription')}
          </p>
        </div>
      </section>

      {pageLoading ? (
        <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <IntegrationCardSkeleton key={i} />
          ))}
        </ul>
      ) : (
        <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedIntegrations.map((integration) => (
            <IntegrationListCard
              key={integration.slug}
              integration={integration}
              lang={lang}
              connected={false}
            />
          ))}
        </ul>
      )}

      <p className="text-sm">
        <Link
          to="/dashboard/integrations"
          className="font-medium text-text-primary underline-offset-4 hover:underline"
        >
          {shellT(lang, 'homeNoIntegrationsViewAll')}
        </Link>
      </p>
    </div>
  )
}
