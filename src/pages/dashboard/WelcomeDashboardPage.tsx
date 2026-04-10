import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'

export function WelcomeDashboardPage() {
  const { lang } = useLanguage()
  return (
    <DashboardPage>
      <div className="flex min-h-[40vh] flex-col justify-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
          {shellT(lang, 'welcomeTitle')}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">{shellT(lang, 'welcomeSubtitle')}</p>
      </div>
    </DashboardPage>
  )
}
