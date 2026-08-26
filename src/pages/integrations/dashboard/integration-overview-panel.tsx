import type { ReactNode } from 'react'
import { ArrowUpRight, BookOpen } from 'lucide-react'

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
  const docsUrl = integration.docsUrl?.trim()

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
      {docsUrl ? (
        <>
          <div className="border-t border-border-subtle" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
              {shellT(lang, 'integrationDetailLinksLabel')}
            </p>
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-text-primary outline-none transition-colors hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <BookOpen className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{shellT(lang, 'integrationDetailDocs')}</span>
              <ArrowUpRight className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
            </a>
          </div>
        </>
      ) : null}
    </aside>
  )
}
