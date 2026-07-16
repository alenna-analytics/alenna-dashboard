import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
import type { IntegrationPlatformRow } from '@/lib/types/connectors'
import { cn } from '@/lib/utils'
import { DeleteAccountDangerZone } from '@/pages/configuration/general/delete-account-danger-zone'
import { DeleteAccountDialog } from '@/pages/configuration/general/delete-account-dialog'
import {
  useDeleteAccountMutation,
} from '@/pages/configuration/general/use-account-deletion-mutations'
import { ExpensesSheet } from '@/pages/reports/expenses-sheet'
import { useExpenses } from '@/pages/reports/use-expenses'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage, type Language } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'

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

function formatDeletionDate(iso: string | null | undefined, lang: string): string {
  if (!iso) {
    const preview = new Date()
    preview.setUTCDate(preview.getUTCDate() + 90)
    return preview.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }
  return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function GeneralConfigurationPage() {
  const { lang, setLang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1], vars?: Parameters<typeof shellT>[2]) =>
      shellT(lang, key, vars),
    [lang],
  )
  const { me, refetchMe } = useWorkspace()
  const deleteMutation = useDeleteAccountMutation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [expensesOpen, setExpensesOpen] = useState(false)
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const expenses = useExpenses()
  const platformsQuery = useQuery({
    queryKey: ['integration-platforms', tenantId],
    enabled: Boolean(tenantId) && expensesOpen,
    queryFn: async (): Promise<IntegrationPlatformRow[]> => {
      const res = await apiFetch(
        '/connectors/integration-platforms',
        (a) => getToken(a),
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as IntegrationPlatformRow[]
    },
  })

  const companyName = useMemo(() => {
    const fromMe = me?.tenant_name?.trim()
    if (fromMe) return fromMe
    return t('shellSidebarWorkspaceFallback')
  }, [me?.tenant_name, t])

  const isWorkspaceAdmin = me?.role === 'admin' || me?.role === 'owner'
  const isPending = me?.account_deletion_status === 'pending'
  const previewScheduledLabel = formatDeletionDate(null, lang)
  const memberCount = me?.member_count ?? 0

  const languageOptions = useMemo(
    () => [
      { value: 'es', label: t('settingsLanguageEs') },
      { value: 'en', label: t('settingsLanguageEn') },
    ],
    [t],
  )

  const handleConfirmDelete = async () => {
    try {
      const result = await deleteMutation.mutateAsync()
      await refetchMe()
      setDialogOpen(false)
      setConfirmName('')
      setUnderstood(false)
      const date = formatDeletionDate(result.scheduled_purge_at, lang)
      toast.success(t('settingsDeleteAccountToastRequested', { date }))
    } catch {
      toast.error(t('settingsDeleteAccountToastFailed'))
    }
  }

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

        <SettingsRow
          label={t('expensesSheetTitle')}
          description={t('expensesSheetDescription')}
        >
          <Button type="button" variant="secondary" onClick={() => setExpensesOpen(true)}>
            {t('expensesAddBtn')}
          </Button>
        </SettingsRow>
      </SettingsSection>

      <ExpensesSheet
        open={expensesOpen}
        onOpenChange={setExpensesOpen}
        expenses={expenses.query.data ?? []}
        platforms={(platformsQuery.data ?? []).map((p) => ({ slug: p.slug, name: p.name }))}
        onCreate={async (body) => {
          await expenses.createMutation.mutateAsync(body)
        }}
        onUpdate={async (id, body) => {
          await expenses.updateMutation.mutateAsync({ id, ...body })
        }}
        onDelete={async (id) => {
          await expenses.deleteMutation.mutateAsync(id)
        }}
        isBusy={
          expenses.createMutation.isPending ||
          expenses.updateMutation.isPending ||
          expenses.deleteMutation.isPending
        }
      />

      {isWorkspaceAdmin && !isPending && !me?.is_fixture ? (
        <DeleteAccountDangerZone
          lang={lang}
          memberCount={memberCount}
          onRequestDelete={() => setDialogOpen(true)}
        />
      ) : null}

      <DeleteAccountDialog
        lang={lang}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setConfirmName('')
            setUnderstood(false)
          }
        }}
        workspaceName={companyName}
        scheduledPurgePreview={previewScheduledLabel}
        confirmName={confirmName}
        onConfirmNameChange={setConfirmName}
        understood={understood}
        onUnderstoodChange={setUnderstood}
        pending={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />
    </DashboardPage>
  )
}
