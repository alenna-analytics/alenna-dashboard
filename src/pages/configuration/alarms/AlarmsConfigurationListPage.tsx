import { CONFIGURABLE_ALARM_TYPES } from '@/pages/configuration/alarms/alarm-types'
import { ConfigurationEntryCard } from '@/pages/configuration/configuration-entry-card'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'

export function AlarmsConfigurationListPage() {
  const { lang } = useLanguage()

  return (
    <DashboardPage className="space-y-8">
      <section>
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
            {shellT(lang, 'navAlarms')}
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            {shellT(lang, 'alarmsListSubtitle')}
          </p>
        </div>
      </section>

      <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONFIGURABLE_ALARM_TYPES.map((alarmType) => (
          <ConfigurationEntryCard
            key={alarmType.id}
            lang={lang}
            to={alarmType.path}
            titleKey={alarmType.titleKey}
            descriptionKey={alarmType.descriptionKey}
            icon={alarmType.icon}
          />
        ))}
      </ul>
    </DashboardPage>
  )
}
