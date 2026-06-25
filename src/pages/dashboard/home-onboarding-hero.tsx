import { shellT } from '@/lib/i18n/shell-strings'
import { HomeOnboardingHeroIllustration } from '@/pages/dashboard/home-onboarding-hero-illustration'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'

type HomeOnboardingHeroProps = {
  lang: string
  onConnectFirst: () => void
}

function useWelcomeLine(lang: string): string {
  const { me } = useWorkspace()
  const firstName = me?.first_name?.trim() ?? ''
  if (firstName.length > 0) {
    return shellT(lang, 'homeOnboardingWelcomeNamed', { name: firstName })
  }
  return shellT(lang, 'homeOnboardingWelcome')
}

export function HomeOnboardingHero({ lang, onConnectFirst }: HomeOnboardingHeroProps) {
  const welcomeLine = useWelcomeLine(lang)

  return (
    <section className="home-onboarding-hero -mx-4 px-4 py-16 sm:py-20 lg:-mx-5 lg:px-5 lg:py-24">
      <div className="relative z-10 mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-xl">
          <p className="text-base text-text-secondary">{welcomeLine}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-text-primary sm:text-5xl sm:leading-[1.08] lg:text-[52px]">
            {shellT(lang, 'homeOnboardingHeadline')}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-text-secondary">
            {shellT(lang, 'homeOnboardingSubheadline')}
          </p>
          <Button size="lg" variant="primary" className="mt-10" onClick={onConnectFirst}>
            {shellT(lang, 'homeOnboardingPrimaryCta')}
          </Button>
        </div>

        <div className="hidden justify-end lg:flex">
          <HomeOnboardingHeroIllustration />
        </div>
      </div>
    </section>
  )
}
