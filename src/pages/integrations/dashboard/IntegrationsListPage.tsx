import { useMemo, useState } from 'react'

import { IntegrationManageSheet } from '@/pages/integrations/dashboard/integration-manage-sheet'
import {
  integrationCategory,
  integrationDescription,
  integrationTitle,
} from '@/pages/integrations/dashboard/integration-display'
import { IntegrationCardSkeleton } from '@/pages/integrations/dashboard/integration-card-skeleton'
import { IntegrationListCard } from '@/pages/integrations/dashboard/integration-list-card'
import { IntegrationsDisconnectDialog } from '@/pages/integrations/dashboard/integrations-disconnect-dialog'
import { IntegrationsSearchField } from '@/pages/integrations/dashboard/integrations-search-field'
import { useIntegrationsListQueries } from '@/pages/integrations/hooks/use-integrations-list-queries'
import { useShopifyIntegration } from '@/pages/integrations/details/use-shopify-integration'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'

export function IntegrationsListPage() {
  const { lang } = useLanguage()
  const [q, setQ] = useState('')
  const [managedSlug, setManagedSlug] = useState<string | null>(null)
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)

  const shopifyIntegration = useShopifyIntegration()
  const { isAdmin, connected: shopifyConnected, disconnectMutation } =
    shopifyIntegration

  const { integrations, pageLoading, pageError } = useIntegrationsListQueries()

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return integrations
    return integrations.filter((i) => {
      const name = integrationTitle(lang, i).toLowerCase()
      const cat = integrationCategory(lang, i).toLowerCase()
      const desc = integrationDescription(lang, i).toLowerCase()
      return (
        name.includes(needle) ||
        cat.includes(needle) ||
        desc.includes(needle) ||
        i.slug.toLowerCase().includes(needle)
      )
    })
  }, [q, lang, integrations])

  const managed = managedSlug
    ? integrations.find((x) => x.slug === managedSlug)
    : undefined

  return (
    <DashboardPage className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
          {shellT(lang, 'integrationsHeroTitle')}
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-text-secondary">
          {shellT(lang, 'integrationsHeroSubtitle')}
        </p>
      </div>

      <IntegrationsSearchField lang={lang} value={q} onChange={setQ} />

      {pageLoading ? (
        <ul className="grid list-none gap-4 sm:grid-cols-2" aria-busy="true" aria-label={shellT(lang, 'connectionsLoading')}>
          {Array.from({ length: 4 }).map((_, i) => (
            <IntegrationCardSkeleton key={i} />
          ))}
        </ul>
      ) : pageError ? (
        <p className="text-sm text-destructive" role="alert">
          {pageError instanceof Error ? pageError.message : String(pageError)}
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {shellT(lang, 'integrationsEmptySearch')}
        </p>
      ) : (
        <ul className="grid list-none gap-4 sm:grid-cols-2">
          {filtered.map((integration) => (
            <IntegrationListCard
              key={integration.slug}
              integration={integration}
              lang={lang}
              shopifyConnected={shopifyConnected}
              isAdmin={isAdmin}
              disconnectPending={disconnectMutation.isPending}
              onManage={() => setManagedSlug(integration.slug)}
              onConnectToggle={(on) => {
                if (on) {
                  setManagedSlug('shopify')
                  return
                }
                if (!shopifyConnected) return
                setDisconnectDialogOpen(true)
              }}
            />
          ))}
        </ul>
      )}

      {managed ? (
        <IntegrationManageSheet
          definition={managed}
          open={managedSlug !== null}
          onOpenChange={(open) => {
            if (!open) setManagedSlug(null)
          }}
          shopify={managed.slug === 'shopify' ? shopifyIntegration : undefined}
        />
      ) : null}

      <IntegrationsDisconnectDialog
        lang={lang}
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        disconnectPending={disconnectMutation.isPending}
        onConfirmDisconnect={() => {
          disconnectMutation.mutate(undefined, {
            onSettled: () => setDisconnectDialogOpen(false),
          })
        }}
      />
    </DashboardPage>
  )
}
