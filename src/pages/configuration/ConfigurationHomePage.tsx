import { useEnabledWorkspaceConfigSubmodules } from '@/lib/modules/use-workspace-config'
import { shellT } from '@/lib/i18n/shell-strings'
import { ConfigurationEntryCard } from '@/pages/configuration/configuration-entry-card'
import { DashboardPage, pageSubtitleClassName, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'

export function ConfigurationHomePage() {
  const { lang } = useLanguage()
  const submodules = useEnabledWorkspaceConfigSubmodules()

  return (
    <DashboardPage className="space-y-8">
      <section>
        <div className="max-w-2xl">
          <h1 className={pageTitleClassName}>
            {shellT(lang, 'navWorkspaceConfiguration')}
          </h1>
          <p className={cn('mt-1.5', pageSubtitleClassName)}>
            {shellT(lang, 'workspaceConfigHeroSubtitle')}
          </p>
        </div>
      </section>

      <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {submodules.map((submodule) => (
          <ConfigurationEntryCard
            key={submodule.id}
            lang={lang}
            to={submodule.path}
            titleKey={submodule.labelKey}
            descriptionKey={submodule.descriptionKey}
            icon={submodule.icon}
          />
        ))}
      </ul>
    </DashboardPage>
  )
}
