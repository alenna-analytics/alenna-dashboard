import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'

export function WelcomeDashboardPage() {
  const { lang } = useLanguage()
  return (
    <DashboardPage className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="max-w-xl">
          <h1 className="max-w-[12ch] text-4xl font-semibold tracking-[-0.045em] text-text-primary sm:text-5xl lg:text-[4.25rem]">
            {shellT(lang, 'welcomeTitle')}
          </h1>
        </div>
      </section>
      <p className="max-w-xl text-sm text-text-secondary">{shellT(lang, 'welcomeSubtitle')}</p>
    </DashboardPage>
  )
}
