import { shellT } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'

type HomeOnboardingJourneyProps = {
  lang: string
}

const JOURNEY_KEYS = [
  'homeOnboardingJourneyConnect',
  'homeOnboardingJourneySync',
  'homeOnboardingJourneyAnalyze',
] as const

export function HomeOnboardingJourney({ lang }: HomeOnboardingJourneyProps) {
  return (
    <nav
      aria-label={shellT(lang, 'homeOnboardingJourneyConnect')}
      className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-14 sm:gap-x-10"
    >
      {JOURNEY_KEYS.map((key, index) => (
        <div key={key} className="flex items-center gap-x-6 sm:gap-x-10">
          <span
            className={cn(
              'text-sm tracking-[0.02em]',
              index === 0 ? 'font-medium text-text-primary' : 'text-text-tertiary',
            )}
          >
            {shellT(lang, key)}
          </span>
          {index < JOURNEY_KEYS.length - 1 ? (
            <span
              className="hidden h-px w-10 bg-border-subtle sm:block sm:w-16"
              aria-hidden
            />
          ) : null}
        </div>
      ))}
    </nav>
  )
}
