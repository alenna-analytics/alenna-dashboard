import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PNL_ROW_IDS, PNL_ROW_LABEL_KEYS } from '@/lib/pnl/pnl-label-keys'
import { shellT } from '@/lib/i18n/shell-strings'
import type { PnlLabelLocale, PnlLabelOverridesApi } from '@/lib/types/pnl-labels'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import { Input } from '@/ui/input'

import {
  usePnlLabelsQuery,
  usePutPnlLabelsMutation,
} from './use-pnl-labels-queries'

function SettingsSection({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <div className="w-full overflow-hidden rounded-md border border-border-default bg-white divide-y divide-border-default">
        {children}
      </div>
    </section>
  )
}

export function PnlTermsConfigurationPage() {
  const { lang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )
  const { me } = useWorkspace()
  const isWorkspaceAdmin = me?.role === 'admin' || me?.role === 'owner'

  const { data, isLoading } = usePnlLabelsQuery()
  const putMutation = usePutPnlLabelsMutation()

  const [editLang, setEditLang] = useState<PnlLabelLocale>(lang === 'en' ? 'en' : 'es')
  const [draft, setDraft] = useState<PnlLabelOverridesApi | null>(null)
  const overrides = draft ?? data?.overrides ?? {}

  const languageOptions = useMemo(
    () => [
      { value: 'es', label: t('settingsLanguageEs') },
      { value: 'en', label: t('settingsLanguageEn') },
    ],
    [t],
  )

  const save = async () => {
    try {
      await putMutation.mutateAsync({ overrides })
      setDraft(null)
      toast.success(t('workspaceConfigPnlTermsSaveSuccess'))
    } catch {
      toast.error(t('workspaceConfigPnlTermsSaveFailed'))
    }
  }

  const restoreDefaults = async () => {
    try {
      await putMutation.mutateAsync({ overrides: {} })
      setDraft(null)
      toast.success(t('workspaceConfigPnlTermsRestoreSuccess'))
    } catch {
      toast.error(t('workspaceConfigPnlTermsSaveFailed'))
    }
  }

  const setCustomLabel = (rowId: (typeof PNL_ROW_IDS)[number], value: string) => {
    setDraft((prev) => {
      const next = structuredClone(prev ?? data?.overrides ?? {})
      const locales = { ...(next[rowId] ?? {}) }
      const trimmed = value.trim()
      if (trimmed) locales[editLang] = trimmed
      else delete locales[editLang]
      if (Object.keys(locales).length > 0) next[rowId] = locales
      else delete next[rowId]
      return next
    })
  }

  return (
    <DashboardPage className="space-y-8">
      <section>
        <h1 className={pageTitleClassName}>{t('workspaceConfigPnlTermsTitle')}</h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          {t('workspaceConfigPnlTermsSubtitle')}
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-xs space-y-1.5">
          <p className="text-sm font-medium text-text-primary">{t('settingsLanguageLabel')}</p>
          <FilterComboboxSingle
            label=""
            options={languageOptions}
            value={editLang}
            onValueChange={(value) => {
              if (value === 'es' || value === 'en') setEditLang(value)
            }}
            searchPlaceholder={t('settingsLanguageLabel')}
            emptyLabel={t('filterComingSoon')}
            allowClear={false}
            labelLayout="stacked"
            triggerClassName="w-full"
          />
        </div>
        {isWorkspaceAdmin ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void restoreDefaults()}
              disabled={putMutation.isPending || isLoading}
            >
              {t('workspaceConfigPnlTermsRestoreDefaults')}
            </Button>
            <Button
              type="button"
              onClick={() => void save()}
              disabled={putMutation.isPending || isLoading}
            >
              {t('workspaceConfigPnlTermsSave')}
            </Button>
          </div>
        ) : null}
      </div>

      <SettingsSection>
        {PNL_ROW_IDS.map((rowId) => {
          const defaultLabel = shellT(editLang, PNL_ROW_LABEL_KEYS[rowId])
          const customLabel = overrides[rowId]?.[editLang] ?? ''
          return (
            <div
              key={rowId}
              className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center sm:gap-6"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{defaultLabel}</p>
                <p className="mt-0.5 text-xs text-text-tertiary">
                  {t('workspaceConfigPnlTermsDefaultLabel')}
                </p>
              </div>
              <div className="hidden text-xs font-medium uppercase tracking-wide text-text-tertiary sm:block">
                {editLang.toUpperCase()}
              </div>
              <Input
                value={customLabel}
                onChange={(event) => setCustomLabel(rowId, event.target.value)}
                placeholder={defaultLabel}
                disabled={!isWorkspaceAdmin || isLoading}
                maxLength={80}
                aria-label={t('workspaceConfigPnlTermsCustomLabelAria').replace(
                  '{concept}',
                  defaultLabel,
                )}
              />
            </div>
          )
        })}
      </SettingsSection>

      {!isWorkspaceAdmin ? (
        <p className="text-sm text-text-secondary">{t('workspaceConfigPnlTermsReadOnlyHint')}</p>
      ) : null}
    </DashboardPage>
  )
}
