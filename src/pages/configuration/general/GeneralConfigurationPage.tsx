import { useAuth } from '@clerk/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { shellT } from '@/lib/i18n/shell-strings'
import { can, isOwner } from '@/lib/permissions/can'
import {
  billingCatalogDescription,
  billingPlanDisplayName,
  isBillingOwner,
  canViewBilling,
  planSummaryLabel,
} from '@/lib/plan/plan-limit-ui'
import { fetchTeamMembers } from '@/lib/team/team-api'
import { memberDisplayName } from '@/lib/team/member-display-name'
import type { TeamMember } from '@/lib/types/team-types'
import { DeleteAccountDangerZone } from '@/pages/configuration/general/delete-account-danger-zone'
import { DeleteAccountDialog } from '@/pages/configuration/general/delete-account-dialog'
import {
  useDeleteAccountMutation,
} from '@/pages/configuration/general/use-account-deletion-mutations'
import {
  isWorkspaceCurrencyCode,
  patchWorkspace,
  type WorkspaceCurrencyCode,
  type WorkspacePatch,
} from '@/pages/configuration/general/workspace-api'
import {
  SettingsCard,
  SettingsRow,
  SettingsSectionHeader,
} from '@/pages/configuration/settings-layout'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage, type Language } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Badge } from '@/ui/badge'
import { Button, buttonVariants } from '@/ui/button'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import { Input } from '@/ui/input'
import { Skeleton } from '@/ui/skeleton'

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
  const { getToken } = useAuth()
  const { lang, setLang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1], vars?: Parameters<typeof shellT>[2]) =>
      shellT(lang, key, vars),
    [lang],
  )
  const { me, refetchMe, refetchTenants } = useWorkspace()
  const deleteMutation = useDeleteAccountMutation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState('')
  const [currencyDraft, setCurrencyDraft] = useState<WorkspaceCurrencyCode>('MXN')

  const companyName = useMemo(() => {
    const fromMe = me?.tenant_name?.trim()
    if (fromMe) return fromMe
    return t('shellSidebarWorkspaceFallback')
  }, [me?.tenant_name, t])

  useEffect(() => {
    setWorkspaceNameDraft(companyName)
  }, [companyName])

  const workspaceCurrency = (me?.base_currency ?? 'MXN').toUpperCase()
  useEffect(() => {
    if (isWorkspaceCurrencyCode(workspaceCurrency)) {
      setCurrencyDraft(workspaceCurrency)
    }
  }, [workspaceCurrency])

  const isWorkspaceAdmin = isOwner(me)
  const canEditName = isWorkspaceAdmin && !me?.is_fixture && me?.account_deletion_status !== 'pending'
  const isPending = me?.account_deletion_status === 'pending'
  const previewScheduledLabel = formatDeletionDate(null, lang)
  const memberCount = me?.member_count ?? 0
  const canViewTeam = can(me, 'team.view')
  const canSeeBilling = canViewBilling(me)
  const canManageBilling = isBillingOwner(me)
  const nameDirty = workspaceNameDraft.trim() !== companyName.trim()
  const currencyDirty =
    isWorkspaceCurrencyCode(workspaceCurrency) && currencyDraft !== workspaceCurrency
  const generalDirty = nameDirty || currencyDirty

  const languageOptions = useMemo(
    () => [
      { value: 'es', label: t('settingsLanguageEs') },
      { value: 'en', label: t('settingsLanguageEn') },
    ],
    [t],
  )
  const currencyOptions = useMemo(
    () => [
      { value: 'MXN', label: t('settingsCurrencyMxn') },
      { value: 'USD', label: t('settingsCurrencyUsd') },
    ],
    [t],
  )

  const tenantId = me?.tenant_id ?? null
  const teamQuery = useQuery({
    queryKey: ['team-members', tenantId],
    enabled: Boolean(tenantId) && canViewTeam,
    queryFn: () => fetchTeamMembers(getToken, tenantId!, lang),
  })

  const activeMembers = useMemo(
    () => (teamQuery.data?.members ?? []).filter((row) => row.status === 'active'),
    [teamQuery.data?.members],
  )
  const displayMembers = useMemo((): TeamMember[] => {
    if (canViewTeam) return activeMembers
    if (!me) return []
    return [
      {
        user_id: me.user_id,
        invitation_id: null,
        email: me.email,
        first_name: me.first_name,
        last_name: me.last_name,
        role_id: '',
        role: me.role,
        role_name: me.role_name,
        status: 'active',
        is_you: true,
      },
    ]
  }, [activeMembers, canViewTeam, me])
  const accessCount =
    canViewTeam && teamQuery.data != null ? activeMembers.length : memberCount
  const accessSubtitle =
    accessCount === 1
      ? t('settingsAccessSubtitleOne')
      : t('settingsAccessSubtitleMany', { count: accessCount })

  const renameMutation = useMutation({
    mutationFn: () => {
      const payload: WorkspacePatch = {}
      if (nameDirty) payload.name = workspaceNameDraft.trim()
      if (currencyDirty) payload.base_currency = currencyDraft
      return patchWorkspace(getToken, tenantId!, payload)
    },
    onSuccess: async () => {
      await refetchMe()
      refetchTenants()
      toast.success(t('settingsWorkspaceSaveSuccess'))
    },
    onError: () => {
      toast.error(t('settingsWorkspaceSaveFailed'))
    },
  })

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

  const planName = me ? billingPlanDisplayName(me) : '—'
  const planDetail = me ? planSummaryLabel(me, lang) : t('settingsPlanSubtitle')
  const planDescription = me ? billingCatalogDescription(me.plan, lang) : null

  return (
    <DashboardPage className="mx-auto w-full max-w-4xl space-y-10">
      <section>
        <div className="w-full">
          <h1 className={pageTitleClassName}>{t('navGeneral')}</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
            {t('workspaceConfigGeneralPageSubtitle')}
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <SettingsSectionHeader title={t('workspaceConfigGeneralSectionTitle')} />
        <SettingsCard>
          <SettingsRow label={t('companyLabel')} description={t('settingsCompanyDescription')}>
            <Input
              value={workspaceNameDraft}
              onChange={(event) => setWorkspaceNameDraft(event.target.value)}
              maxLength={200}
              disabled={!canEditName || renameMutation.isPending}
              aria-label={t('companyLabel')}
            />
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
            label={t('settingsCurrencyLabel')}
            description={t('settingsCurrencyDescription')}
          >
            {canEditName ? (
              <FilterComboboxSingle
                label=""
                options={currencyOptions}
                value={currencyDraft}
                onValueChange={(value) => {
                  if (isWorkspaceCurrencyCode(value)) setCurrencyDraft(value)
                }}
                searchPlaceholder={t('settingsCurrencyLabel')}
                emptyLabel={t('filterComingSoon')}
                allowClear={false}
                labelLayout="stacked"
                triggerClassName="w-full"
              />
            ) : (
              <p className="text-sm font-medium text-text-primary">
                {currencyOptions.find((option) => option.value === currencyDraft)?.label ??
                  currencyDraft}
              </p>
            )}
          </SettingsRow>
          {canEditName ? (
            <div className="flex justify-end px-4 py-3">
              <Button
                type="button"
                variant="accent"
                size="tiny"
                loading={renameMutation.isPending}
                disabled={!generalDirty || !tenantId}
                onClick={() => renameMutation.mutate()}
              >
                {t('workspaceConfigPnlTermsSave')}
              </Button>
            </div>
          ) : null}
        </SettingsCard>
      </section>

      <section className="space-y-6">
        <SettingsSectionHeader title={t('settingsAccessTitle')} />
        <SettingsCard>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{t('navTeam')}</p>
              <p className="mt-0.5 text-sm leading-snug text-text-secondary">{accessSubtitle}</p>
            </div>
            {canViewTeam ? (
              <Link
                to="/dashboard/team"
                className={buttonVariants({ variant: 'outline', size: 'tiny' })}
              >
                {t('settingsManageMembers')}
              </Link>
            ) : null}
          </div>
          <div className="px-4 pb-4">
            <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-border-subtle py-2 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
              <span>{t('teamColumnMember')}</span>
              <span>{t('teamColumnRole')}</span>
            </div>
            {canViewTeam && teamQuery.isLoading ? (
              <div className="space-y-2 py-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ) : displayMembers.length === 0 ? (
              <p className="py-3 text-sm text-text-secondary">{t('settingsAccessEmpty')}</p>
            ) : (
              <ul>
                {displayMembers.map((member) => (
                  <AccessMemberRow
                    key={member.user_id ?? member.invitation_id ?? member.email}
                    member={member}
                    t={t}
                  />
                ))}
              </ul>
            )}
          </div>
        </SettingsCard>
      </section>

      <section className="space-y-6">
        <SettingsSectionHeader title={t('settingsPlanTitle')} description={t('settingsPlanSubtitle')} />
        <SettingsCard>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{planName}</p>
              <p className="mt-0.5 text-sm leading-snug text-text-secondary">
                {planDescription ?? planDetail}
              </p>
            </div>
            {canSeeBilling ? (
              <Link
                to="/dashboard/billing"
                className={buttonVariants({ variant: 'outline', size: 'tiny' })}
              >
                {canManageBilling ? t('settingsManageBilling') : t('navBilling')}
              </Link>
            ) : null}
          </div>
        </SettingsCard>
      </section>

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

function AccessMemberRow({
  member,
  t,
}: {
  member: TeamMember
  t: (key: Parameters<typeof shellT>[1]) => string
}) {
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border-subtle py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-text-primary">
            {memberDisplayName(member)}
          </span>
          {member.is_you ? <Badge variant="secondary">{t('teamYouBadge')}</Badge> : null}
        </div>
        <p className="truncate text-xs text-text-tertiary">{member.email}</p>
      </div>
      <span className="text-sm text-text-secondary">{member.role_name}</span>
    </li>
  )
}
