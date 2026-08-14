import { useAuth } from '@clerk/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  createWorkspaceRole,
  deleteWorkspaceRole,
  updateWorkspaceRole,
} from '@/lib/team/team-api'
import { ASSIGNABLE_PERMISSION_KEYS } from '@/lib/permissions/can'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { WorkspaceRole } from '@/lib/types/team-types'
import { useLanguage, type Language } from '@/shell/providers/language-provider'
import { Button, buttonVariants } from '@/ui/button'
import { Checkbox } from '@/ui/checkbox'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { cn } from '@/lib/utils'

const PERM_LABEL: Record<string, ShellStringKey> = {
  'team.manage': 'permTeamManage',
  'integrations.manage': 'permIntegrationsManage',
  'alerts.manage': 'permAlertsManage',
  'fx.manage': 'permFxManage',
  'pnl_labels.manage': 'permPnlLabelsManage',
  'account.deletion': 'permAccountDeletion',
}

type WorkspaceRolesPanelProps = {
  tenantId: string
  roles: WorkspaceRole[]
  rolesUsed: number
  rolesLimit: number | null
  canManageRoles: boolean
  isOwner: boolean
}

export function WorkspaceRolesPanel({
  tenantId,
  roles,
  rolesUsed,
  rolesLimit,
  canManageRoles,
  isOwner,
}: WorkspaceRolesPanelProps) {
  const { getToken } = useAuth()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['workspace-roles', tenantId] })
    void queryClient.invalidateQueries({ queryKey: ['team-members', tenantId] })
  }

  if (!isOwner) return null

  if (!canManageRoles) {
    return (
      <section className="rounded-md border border-border-default bg-white p-4">
        <h2 className="text-sm font-medium text-text-primary">{t('teamRolesSectionTitle')}</h2>
        <p className="mt-1 text-sm text-text-secondary">{t('teamRolesUpgradeCopy')}</p>
        <Link
          to="/dashboard/billing"
          className={cn(buttonVariants({ variant: 'accent', size: 'sm' }), 'mt-3 inline-flex')}
        >
          {t('planUpgradeToGrowth')}
        </Link>
      </section>
    )
  }

  const staffId = roles.find((role) => role.system_key === 'staff')?.id ?? null
  const atLimit = rolesLimit != null && rolesUsed >= rolesLimit

  return (
    <section className="space-y-3 rounded-md border border-border-default bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-text-primary">{t('teamRolesSectionTitle')}</h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            {t('teamRolesUsed').replace('{used}', String(rolesUsed)).replace(
              '{limit}',
              rolesLimit == null ? '∞' : String(rolesLimit),
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={atLimit || editingId === 'new'}
          onClick={() => {
            setError(null)
            setEditingId('new')
          }}
        >
          {t('teamRolesCreate')}
        </Button>
      </div>

      {atLimit ? <p className="text-xs text-text-secondary">{t('teamRolesLimitReached')}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {editingId === 'new' ? (
        <RoleEditor
          tenantId={tenantId}
          getToken={getToken}
          lang={lang}
          t={t}
          existing={null}
          onCancel={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null)
            invalidate()
          }}
          onError={setError}
        />
      ) : null}

      <ul className="divide-y divide-border-default">
        {roles.map((role) => (
          <li key={role.id} className="py-3">
            {editingId === role.id ? (
              <RoleEditor
                tenantId={tenantId}
                getToken={getToken}
                lang={lang}
                t={t}
                existing={role}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null)
                  invalidate()
                }}
                onError={setError}
              />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{role.name}</p>
                  <p className="text-xs text-text-secondary">
                    {role.system_key === 'owner'
                      ? t('teamRolesOwnerLocked')
                      : t('teamRolesMemberCount').replace('{count}', String(role.member_count))}
                  </p>
                </div>
                {role.system_key === 'owner' ? null : (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setError(null)
                        setEditingId(role.id)
                      }}
                    >
                      {t('teamEditRoleAction')}
                    </Button>
                    {role.system_key == null ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setError(null)
                          void deleteWorkspaceRole(getToken, tenantId, role.id, staffId, lang)
                            .then(invalidate)
                            .catch((err: Error) => setError(err.message))
                        }}
                      >
                        {t('teamRolesDelete')}
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function RoleEditor({
  tenantId,
  getToken,
  lang,
  t,
  existing,
  onCancel,
  onSaved,
  onError,
}: {
  tenantId: string
  getToken: ReturnType<typeof useAuth>['getToken']
  lang: Language
  t: (key: ShellStringKey) => string
  existing: WorkspaceRole | null
  onCancel: () => void
  onSaved: () => void
  onError: (message: string | null) => void
}) {
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [selected, setSelected] = useState<string[]>(existing?.permissions ?? [])
  const locked = existing?.system_key === 'owner'

  const save = useMutation({
    mutationFn: async () => {
      if (existing) {
        await updateWorkspaceRole(
          getToken,
          tenantId,
          existing.id,
          { name: name.trim(), description: description.trim() || null, permissions: selected },
          lang,
        )
        return
      }
      await createWorkspaceRole(
        getToken,
        tenantId,
        { name: name.trim(), description: description.trim() || null, permissions: selected },
        lang,
      )
    },
    onSuccess: () => {
      onError(null)
      onSaved()
    },
    onError: (err: Error) => onError(err.message),
  })

  if (locked) return null

  return (
    <div className="space-y-3 rounded-md border border-border-subtle p-3">
      <div className="space-y-1">
        <Label htmlFor="role-name">{t('teamRolesNameLabel')}</Label>
        <Input
          id="role-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={save.isPending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="role-desc">{t('teamRolesDescriptionLabel')}</Label>
        <Input
          id="role-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={save.isPending}
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t('teamRolesPermissionsLabel')}</legend>
        {ASSIGNABLE_PERMISSION_KEYS.map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.includes(key)}
              onCheckedChange={(checked) => {
                setSelected((prev) =>
                  checked ? [...prev, key] : prev.filter((item) => item !== key),
                )
              }}
              disabled={save.isPending}
            />
            {t(PERM_LABEL[key])}
          </label>
        ))}
      </fieldset>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={save.isPending}>
          {t('teamInviteCancel')}
        </Button>
        <Button
          type="button"
          variant="accent"
          size="sm"
          disabled={!name.trim()}
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          {t('teamRolesSave')}
        </Button>
      </div>
    </div>
  )
}
