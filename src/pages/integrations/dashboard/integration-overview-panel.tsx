import type { ReactNode } from 'react'

import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { shellT } from '@/lib/i18n/shell-strings'
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
      <div className="mt-1.5 text-sm text-text-primary">{value}</div>
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
  return (
    <aside className="flex flex-col gap-6 lg:border-l lg:border-border-subtle lg:pl-8">
      <MetaItem
        label={shellT(lang, 'integrationDetailTypeLabel')}
        value={shellT(lang, 'integrationDetailTypeOauth')}
      />
      <MetaItem label={shellT(lang, 'integrationDetailBuiltBy')} value="Alenna Analytics" />
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
    </aside>
  )
}
