import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { MAX_PNL_LABEL_LENGTH, PNL_ROW_IDS, PNL_ROW_LABEL_KEYS } from '@/lib/pnl/pnl-label-keys'
import { normalizePnlLabelOverrides, serializePnlLabelOverrides } from '@/lib/pnl/resolve-pnl-label'
import { shellT } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import type { PnlLabelLocale, PnlLabelOverridesApi } from '@/lib/types/pnl-labels'
import {
  SettingsCard,
  SettingsRow,
  SettingsSectionHeader,
} from '@/pages/configuration/settings-layout'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import { Input } from '@/ui/input'
import { Skeleton } from '@/ui/skeleton'

import {
  usePnlLabelsQuery,
  usePutPnlLabelsMutation,
} from './use-pnl-labels-queries'

export function PnlTermsConfigurationPage() {
  const { lang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )
  const { me } = useWorkspace()
  const isWorkspaceAdmin = can(me, 'pnl_labels.manage')

  const { data, isPending, isError } = usePnlLabelsQuery()
  const termsLoading = isPending && !isError
  const putMutation = usePutPnlLabelsMutation()

  const [editLang, setEditLang] = useState<PnlLabelLocale>(lang === 'en' ? 'en' : 'es')
  const [draft, setDraft] = useState<PnlLabelOverridesApi | null>(null)
  const saved = data?.overrides ?? {}
  const working = draft ?? saved
  const isDirty = serializePnlLabelOverrides(working) !== serializePnlLabelOverrides(saved)
  const hasCustomLabels = serializePnlLabelOverrides(working) !== '{}'

  const save = async () => {
    try {
      await putMutation.mutateAsync({ overrides: normalizePnlLabelOverrides(working) })
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
      const next = structuredClone(prev ?? saved)
      const locales = { ...(next[rowId] ?? {}) }
      if (value.length > 0) locales[editLang] = value.slice(0, MAX_PNL_LABEL_LENGTH)
      else delete locales[editLang]
      if (Object.keys(locales).length > 0) next[rowId] = locales
      else delete next[rowId]
      return next
    })
  }

  const languageOptions = useMemo(
    () => [
      { value: 'es', label: t('settingsLanguageEs') },
      { value: 'en', label: t('settingsLanguageEn') },
    ],
    [t],
  )

  return (
    <DashboardPage className="mx-auto w-full max-w-4xl space-y-10">
      <section>
        <div className="w-full">
          <h1 className={pageTitleClassName}>{t('workspaceConfigPnlTermsTitle')}</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
            {t('workspaceConfigPnlTermsSubtitle')}
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <SettingsSectionHeader title={t('workspaceConfigPnlTermsDescription')} />
        <SettingsCard>
          <SettingsRow
            label={t('settingsLanguageLabel')}
            description={t('workspaceConfigPnlTermsDescription')}
          >
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
          </SettingsRow>
          {PNL_ROW_IDS.map((rowId) => {
            const defaultLabel = shellT(editLang, PNL_ROW_LABEL_KEYS[rowId])
            const customLabel = working[rowId]?.[editLang] ?? ''
            return (
              <SettingsRow
                key={rowId}
                label={defaultLabel}
                description={t('workspaceConfigPnlTermsDefaultLabel')}
              >
                {termsLoading ? (
                  <Skeleton className="h-[33px] w-full" />
                ) : (
                  <div className="relative min-w-0">
                    <Input
                      value={customLabel}
                      onChange={(event) => setCustomLabel(rowId, event.target.value)}
                      placeholder={defaultLabel}
                      disabled={!isWorkspaceAdmin}
                      maxLength={MAX_PNL_LABEL_LENGTH}
                      className="pr-12"
                      aria-label={t('workspaceConfigPnlTermsCustomLabelAria').replace(
                        '{concept}',
                        defaultLabel,
                      )}
                    />
                    {customLabel.length > 0 ? (
                      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs tabular-nums text-text-tertiary">
                        {customLabel.length}/{MAX_PNL_LABEL_LENGTH}
                      </span>
                    ) : null}
                  </div>
                )}
              </SettingsRow>
            )
          })}
          {isWorkspaceAdmin ? (
            <div className="flex flex-wrap justify-end gap-2 px-4 py-3">
              {hasCustomLabels ? (
                <Button
                  type="button"
                  variant="outline"
                  size="tiny"
                  loading={putMutation.isPending}
                  disabled={termsLoading}
                  onClick={() => void restoreDefaults()}
                >
                  {t('workspaceConfigPnlTermsRestoreDefaults')}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="accent"
                size="tiny"
                loading={putMutation.isPending}
                disabled={!isDirty || termsLoading}
                onClick={() => void save()}
              >
                {t('workspaceConfigPnlTermsSave')}
              </Button>
            </div>
          ) : null}
        </SettingsCard>
      </section>

      {!isWorkspaceAdmin ? (
        <p className="text-sm text-text-secondary">{t('workspaceConfigPnlTermsReadOnlyHint')}</p>
      ) : null}
    </DashboardPage>
  )
}
