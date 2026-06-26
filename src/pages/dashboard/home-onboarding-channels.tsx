import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'
import {
  integrationDescription,
  integrationTitle,
} from '@/pages/integrations/dashboard/integration-display'
import { shellT } from '@/lib/i18n/shell-strings'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Skeleton } from '@/ui/skeleton'

type HomeOnboardingChannelsProps = {
  lang: string
  integrations: ManagedIntegration[]
  loading: boolean
  onConnect: (slug: string) => void
}

function ChannelRow({
  integration,
  lang,
  onConnect,
}: {
  integration: ManagedIntegration
  lang: string
  onConnect: (slug: string) => void
}) {
  const name = integrationTitle(lang, integration)
  const description = integrationDescription(lang, integration)

  return (
    <li className="group flex flex-col gap-5 rounded-2xl px-2 py-5 transition-colors hover:bg-bg-section/80 sm:flex-row sm:items-center sm:gap-6 sm:px-4">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <IntegrationLogo
          src={integration.logoSrc}
          alt={name}
          size="lg"
          className="size-12 border-0 bg-bg-elevated p-2"
        />
        <div className="min-w-0 pt-0.5">
          <h3 className="text-base font-semibold text-text-primary">{name}</h3>
          {description ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 sm:pl-2">
        {integration.available ? (
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onConnect(integration.slug)}
          >
            {shellT(lang, 'integrationsActionConnect')}
          </Button>
        ) : (
          <Badge variant="default">{shellT(lang, 'integrationsComingSoonBadge')}</Badge>
        )}
      </div>
    </li>
  )
}

export function HomeOnboardingChannels({
  lang,
  integrations,
  loading,
  onConnect,
}: HomeOnboardingChannelsProps) {
  return (
    <section className="max-w-3xl">
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-text-primary">
        {shellT(lang, 'homeOnboardingChannelsTitle')}
      </h2>

      <ul className="mt-6 list-none divide-y divide-border-subtle">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <li key={index} className="flex items-center gap-4 py-5">
                <Skeleton className="size-12 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-full max-w-sm rounded" />
                </div>
                <Skeleton className="h-10 w-24 rounded-md" />
              </li>
            ))
          : integrations.map((integration) => (
              <ChannelRow
                key={integration.slug}
                integration={integration}
                lang={lang}
                onConnect={onConnect}
              />
            ))}
      </ul>
    </section>
  )
}
