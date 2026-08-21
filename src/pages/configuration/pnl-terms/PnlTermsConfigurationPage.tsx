import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { MAX_PNL_LABEL_LENGTH, PNL_ROW_IDS, PNL_ROW_LABEL_KEYS } from '@/lib/pnl/pnl-label-keys'
import { normalizePnlLabelOverrides, serializePnlLabelOverrides } from '@/lib/pnl/resolve-pnl-label'
import { shellT } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import type { PnlLabelLocale, PnlLabelOverridesApi } from '@/lib/types/pnl-labels'
import { ProductDetailUnsavedBar } from '@/pages/products/product-detail-unsaved-bar'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Skeleton } from '@/ui/skeleton'

import {
  usePnlLabelsQuery,
  usePutPnlLabelsMutation,
} from './use-pnl-labels-queries'

function SettingsSection({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <div className="w-full overflow-hidden rounded-lg border border-border-card bg-white divide-y divide-border-card">
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
    () =>
      [
        { value: 'es' as const, label: t('settingsLanguageEs') },
        { value: 'en' as const, label: t('settingsLanguageEn') },
      ] satisfies { value: PnlLabelLocale; label: string }[],
    [t],
  )

  return (
    <DashboardPage className="space-y-8">
      <section>
        <h1 className={pageTitleClassName}>{t('workspaceConfigPnlTermsTitle')}</h1>
        <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
          {t('workspaceConfigPnlTermsSubtitle')}
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-xs space-y-1.5">
          <p className="text-sm font-medium text-text-primary">{t('settingsLanguageLabel')}</p>
          <Select
            value={editLang}
            itemToStringLabel={(value) =>
              languageOptions.find((option) => option.value === value)?.label ?? String(value)
            }
            onValueChange={(value) => {
              if (value === 'es' || value === 'en') setEditLang(value)
            }}
          >
            <SelectTrigger className="h-[33px] w-full rounded-md border-border-default bg-white shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false} className="min-w-[var(--anchor-width)]">
              {languageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} label={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isWorkspaceAdmin && hasCustomLabels ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 text-text-secondary"
            onClick={() => void restoreDefaults()}
            loading={putMutation.isPending}
            disabled={termsLoading}
          >
            {t('workspaceConfigPnlTermsRestoreDefaults')}
          </Button>
        ) : null}
      </div>

      <SettingsSection>
        {PNL_ROW_IDS.map((rowId) => {
          const defaultLabel = shellT(editLang, PNL_ROW_LABEL_KEYS[rowId])
          const customLabel = working[rowId]?.[editLang] ?? ''
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
              <div className="relative min-w-0">
                {termsLoading ? (
                  <Skeleton className="h-[33px] w-full" />
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          )
        })}
      </SettingsSection>

      {!isWorkspaceAdmin ? (
        <p className="text-sm text-text-secondary">{t('workspaceConfigPnlTermsReadOnlyHint')}</p>
      ) : null}

      {isWorkspaceAdmin ? (
        <ProductDetailUnsavedBar
          open={isDirty}
          t={t}
          onDiscard={() => setDraft(null)}
          onSave={() => void save()}
          savePending={putMutation.isPending}
        />
      ) : null}
    </DashboardPage>
  )
}
