import { useCallback, useMemo, type ReactNode } from 'react'

import { shellT } from '@/lib/i18n/shell-strings'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage, type Language } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import { cn } from '@/lib/utils'

function SettingsSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn(className)}>
      <div className="w-full overflow-hidden rounded-md border border-border-default bg-white divide-y divide-border-default">
        {children}
      </div>
    </section>
  )
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="mt-0.5 text-sm leading-snug text-text-secondary">{description}</p>
      </div>
      <div className="w-full min-w-0 sm:max-w-sm sm:shrink-0">{children}</div>
    </div>
  )
}

export function GeneralConfigurationPage() {
  const { lang, setLang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )
  const { me } = useWorkspace()

  const companyName = useMemo(() => {
    const fromMe = me?.tenant_name?.trim()
    if (fromMe) return fromMe
    return t('shellSidebarWorkspaceFallback')
  }, [me?.tenant_name, t])

  const languageOptions = useMemo(
    () => [
      { value: 'es', label: t('settingsLanguageEs') },
      { value: 'en', label: t('settingsLanguageEn') },
    ],
    [t],
  )

  return (
    <DashboardPage className="space-y-8">
      <section>
        <div className="w-full">
          <h1 className="text-subtitle font-semibold tracking-[-0.02em] text-text-primary">
            {t('navGeneral')}
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            {t('workspaceConfigGeneralPageSubtitle')}
          </p>
        </div>
      </section>

      <SettingsSection>
        <SettingsRow label={t('companyLabel')} description={t('settingsCompanyDescription')}>
          <p className="text-sm font-medium text-text-primary">{companyName}</p>
        </SettingsRow>

        <SettingsRow
          label={t('settingsLanguageLabel')}
          description={t('settingsLanguageDescription')}
        >
          <FilterComboboxSingle
            label=""
            options={languageOptions}
            value={lang}
            onValueChange={(value) => {
              if (value === 'es' || value === 'en') setLang(value as Language)
            }}
            searchPlaceholder={t('settingsLanguageLabel')}
            emptyLabel={t('filterComingSoon')}
            allowClear={false}
            labelLayout="stacked"
            triggerClassName="w-full"
          />
        </SettingsRow>
      </SettingsSection>
    </DashboardPage>
  )
}
