import type { ReactNode } from 'react'

import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { integrationCategory } from '@/pages/integrations/dashboard/integration-display'
import { shellT } from '@/lib/i18n/shell-strings'
import { Badge } from '@/ui/badge'
import { StatusPill } from '@/ui/status-pill'

type IntegrationOverviewPanelProps = {
  integration: ManagedIntegration
  lang: string
  connected: boolean
}

function MetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <div className="mt-1 text-sm text-text-primary">{value}</div>
    </div>
  )
}

function IntegrationStatusPill({
  lang,
  connected,
  available,
}: {
  lang: string
  connected: boolean
  available: boolean
}) {
  if (connected) {
    return (
      <StatusPill variant="success">{shellT(lang, 'integrationsStatusConnected')}</StatusPill>
    )
  }

  if (available) {
    return (
      <StatusPill variant="neutral">{shellT(lang, 'integrationsStatusNotConnected')}</StatusPill>
    )
  }

  return (
    <StatusPill variant="warning">{shellT(lang, 'integrationsComingSoonBadge')}</StatusPill>
  )
}

export function IntegrationOverviewPanel({
  integration,
  lang,
  connected,
}: IntegrationOverviewPanelProps) {
  const category = integrationCategory(lang, integration)

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-3">
        <MetaItem label={shellT(lang, 'integrationDetailBuiltBy')} value="Alenna Analytics" />
        {category ? (
          <MetaItem label={shellT(lang, 'integrationDetailCategoryLabel')} value={category} />
        ) : null}
        <MetaItem
          label={shellT(lang, 'integrationDetailStatusLabel')}
          value={
            <IntegrationStatusPill
              lang={lang}
              connected={connected}
              available={integration.available}
            />
          }
        />
      </div>

      {!integration.available ? (
        <Badge variant="default">{shellT(lang, 'integrationsComingSoonBadge')}</Badge>
      ) : null}
    </div>
  )
}
