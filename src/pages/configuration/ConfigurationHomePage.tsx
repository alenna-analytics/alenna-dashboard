import { useEnabledWorkspaceConfigSubmodules } from '@/lib/modules/use-workspace-config'
import { ConfigurationEntryCard } from '@/pages/configuration/configuration-entry-card'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'

export function ConfigurationHomePage() {
  const { lang } = useLanguage()
  const submodules = useEnabledWorkspaceConfigSubmodules()

  return (
    <DashboardPage className="space-y-8">
      <section>
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
            {shellT(lang, 'navWorkspaceConfiguration')}
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
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
