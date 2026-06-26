import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { HomeOnboardingChannels } from '@/pages/dashboard/home-onboarding-channels'
import { HomeOnboardingDashboardPreview } from '@/pages/dashboard/home-onboarding-dashboard-preview'
import { HomeOnboardingHero } from '@/pages/dashboard/home-onboarding-hero'
import { HomeOnboardingJourney } from '@/pages/dashboard/home-onboarding-journey'
import { useIntegrationsListQueries } from '@/pages/integrations/hooks/use-integrations-list-queries'

type HomeNoIntegrationsStateProps = {
  lang: string
}

export function HomeNoIntegrationsState({ lang }: HomeNoIntegrationsStateProps) {
  const navigate = useNavigate()
  const { integrations, pageLoading } = useIntegrationsListQueries()

  const sortedIntegrations = useMemo(
    () =>
      [...integrations].sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1
        return a.sortOrder - b.sortOrder
      }),
    [integrations],
  )

  const firstAvailableSlug = useMemo(
    () => sortedIntegrations.find((integration) => integration.available)?.slug,
    [sortedIntegrations],
  )

  const handleConnect = useCallback(
    (slug: string) => {
      navigate(`/dashboard/integrations/${slug}`)
    },
    [navigate],
  )

  const handleConnectFirst = useCallback(() => {
    if (firstAvailableSlug) {
      navigate(`/dashboard/integrations/${firstAvailableSlug}`)
      return
    }
    navigate('/dashboard/integrations')
  }, [firstAvailableSlug, navigate])

  return (
    <div className="animate-in fade-in duration-500 flex flex-1 flex-col">
      <HomeOnboardingHero lang={lang} onConnectFirst={handleConnectFirst} />

      <div className="mx-auto w-full max-w-[1200px]">
        <HomeOnboardingChannels
          lang={lang}
          integrations={sortedIntegrations}
          loading={pageLoading}
          onConnect={handleConnect}
        />

        <HomeOnboardingJourney lang={lang} />

        <HomeOnboardingDashboardPreview lang={lang} />
      </div>
    </div>
  )
}
