import { Link } from 'react-router-dom'

import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'
import {
  integrationCategory,
  integrationDescription,
  integrationTitle,
} from '@/pages/integrations/dashboard/integration-display'
import { shellT } from '@/lib/i18n/shell-strings'
import { StatusPill } from '@/ui/status-pill'
import { cn } from '@/lib/utils'
import { settingsDescriptionClassName } from '@/pages/configuration/settings-layout'

type IntegrationListCardProps = {
  integration: ManagedIntegration
  lang: string
  connected: boolean
  needsInitialSync?: boolean
}

export function IntegrationListCard({
  integration,
  lang,
  connected,
  needsInitialSync = false,
}: IntegrationListCardProps) {
  const name = integrationTitle(lang, integration)
  const desc = integrationDescription(lang, integration)
  const category = integrationCategory(lang, integration)

  return (
    <li>
      <Link
        to={`/dashboard/integrations/${integration.slug}`}
        className={cn(
          'group flex h-full flex-col rounded-lg border border-border-card bg-white p-5',
          'transition-colors hover:border-border-strong',
          needsInitialSync &&
            'border-warning/30 bg-[color-mix(in_srgb,var(--pill-warning-bg)_24%,white)]',
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <IntegrationLogo
            src={integration.logoSrc}
            alt={name}
            size="card"
            className="bg-white"
          />
          {connected || needsInitialSync ? (
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {connected ? (
                <StatusPill variant="success">
                  {shellT(lang, 'integrationDetailInstalledBadge')}
                </StatusPill>
              ) : null}
              {needsInitialSync ? (
                <StatusPill variant="warning">
                  {shellT(lang, 'integrationCardSyncPending')}
                </StatusPill>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-text-primary">{name}</h2>
          <p className={cn('mt-1 line-clamp-2', settingsDescriptionClassName)}>{desc}</p>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {!integration.available ? (
              <StatusPill variant="warning">{shellT(lang, 'integrationsComingSoonBadge')}</StatusPill>
            ) : connected ? null : (
              <StatusPill
                variant="neutral"
                className="border-border-default bg-transparent text-text-secondary"
              >
                {shellT(lang, 'integrationsStatusNotConnected')}
              </StatusPill>
            )}
          </div>
          {category ? (
            <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
              {category}
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  )
}
