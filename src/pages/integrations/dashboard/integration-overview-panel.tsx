import { CheckCircle2 } from 'lucide-react'

import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { resolveConnectionSyncFreshnessPillContent } from '@/lib/integrations/sync-freshness'
import type { PlatformConnection } from '@/lib/types/connectors'
import { SyncFreshnessPillBadge } from '@/components/integrations/sync-freshness-badge'
import {
  integrationCategory,
  integrationDescription,
  integrationTitle,
} from '@/pages/integrations/dashboard/integration-display'
import { shellT } from '@/lib/i18n/shell-strings'
import { Badge } from '@/ui/badge'

type IntegrationOverviewPanelProps = {
  integration: ManagedIntegration
  lang: string
  connected: boolean
  connection?: PlatformConnection | null
  forceSyncing?: boolean
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm text-text-primary">{value}</p>
    </div>
  )
}

export function IntegrationOverviewPanel({
  integration,
  lang,
  connected,
  connection,
  forceSyncing = false,
}: IntegrationOverviewPanelProps) {
  const title = integrationTitle(lang, integration)
  const description = integrationDescription(lang, integration)
  const category = integrationCategory(lang, integration)
  const syncPill =
    connected && connection
      ? resolveConnectionSyncFreshnessPillContent(connection, { forceSyncing })
      : null

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-3">
        <MetaItem label={shellT(lang, 'integrationDetailBuiltBy')} value="Alenna" />
        {category ? (
          <MetaItem label={shellT(lang, 'integrationDetailCategoryLabel')} value={category} />
        ) : null}
        <MetaItem
          label={shellT(lang, 'integrationDetailStatusLabel')}
          value={
            connected
              ? shellT(lang, 'integrationsStatusConnected')
              : integration.available
                ? shellT(lang, 'integrationsStatusNotConnected')
                : shellT(lang, 'integrationsComingSoonBadge')
          }
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
        {!integration.available ? (
          <Badge variant="default">{shellT(lang, 'integrationsComingSoonBadge')}</Badge>
        ) : null}
      </div>

      {connected ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border-default bg-white px-4 py-3">
          <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
          <span className="text-sm font-medium text-text-primary">
            {shellT(lang, 'integrationDetailInstalledBadge')}
          </span>
          {syncPill ? <SyncFreshnessPillBadge pill={syncPill} lang={lang} /> : null}
          <span className="sr-only">{title}</span>
        </div>
      ) : null}
    </div>
  )
}
