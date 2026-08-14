import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'

export function IntegrationsAdsComingSoonPage() {
  const { lang } = useLanguage()

  return (
    <DashboardPage className="space-y-8">
      <section>
        <div className="max-w-2xl">
          <h1 className={pageTitleClassName}>
            {shellT(lang, 'integrationsNavAds')}
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
            {shellT(lang, 'integrationsAdsComingSoonDescription')}
          </p>
        </div>
      </section>

      <div className="flex min-h-[240px] items-center justify-center rounded-md border border-dashed border-border-default bg-white px-6 py-10">
        <p className="text-sm font-medium text-text-secondary">
          {shellT(lang, 'filterComingSoon')}
        </p>
      </div>
    </DashboardPage>
  )
}
