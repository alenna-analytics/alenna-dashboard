import { useAuth } from '@clerk/react'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import { AssignMembersCombobox } from '@/components/team/assign-members-combobox'
import { PermissionGroupToggles } from '@/components/team/permission-group-toggles'
import {
  GrantedPermissionTree,
  RoleSummaryField,
} from '@/components/team/role-permission-hierarchy'
import { createWorkspaceRole, updateTeamMemberRole } from '@/lib/team/team-api'
import { memberDisplayName } from '@/lib/team/member-display-name'
import { permissionHierarchy, visiblePermissionGroups } from '@/lib/permissions/permission-groups'
import { shellT } from '@/lib/i18n/shell-strings'
import type { TeamMember } from '@/lib/types/team-types'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'

type Step = 1 | 2 | 3
const TOTAL_STEPS = 3
const FORM_GRID =
  'grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start sm:gap-x-8'

type CreateWorkspaceRoleWizardProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  members: TeamMember[]
  onSuccess: () => void
}

function assignableMembers(members: TeamMember[]): TeamMember[] {
  return members.filter(
    (member) =>
      member.status === 'active' &&
      member.user_id != null &&
      member.role.trim().toLowerCase() !== 'owner',
  )
}

export function CreateWorkspaceRoleWizard({
  open,
  onOpenChange,
  tenantId,
  members,
  onSuccess,
}: CreateWorkspaceRoleWizardProps) {
  const { getToken } = useAuth()
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1], vars?: Record<string, string | number>) =>
      shellT(lang, key, vars),
    [lang],
  )

  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [userIds, setUserIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const candidates = useMemo(() => assignableMembers(members), [members])
  const selectedMembers = useMemo(
    () => candidates.filter((member) => member.user_id != null && userIds.includes(member.user_id)),
    [candidates, userIds],
  )
  const groups = useMemo(
    () =>
      permissionHierarchy(permissions, visiblePermissionGroups(me?.modules ?? [])),
    [me?.modules, permissions],
  )

  function reset() {
    setStep(1)
    setName('')
    setPermissions([])
    setUserIds([])
    setError(null)
  }

  const save = useMutation({
    mutationFn: async () => {
      const role = await createWorkspaceRole(
        getToken,
        tenantId,
        { name: name.trim(), description: null, permissions },
        lang,
      )
      const failures: string[] = []
      for (const userId of userIds) {
        try {
          await updateTeamMemberRole(getToken, tenantId, userId, role.id, lang)
        } catch (err) {
          failures.push(err instanceof Error ? err.message : userId)
        }
      }
      if (failures.length > 0) {
        throw new Error(t('teamRolesAssignPartial'))
      }
    },
    onSuccess: () => {
      reset()
      onSuccess()
      onOpenChange(false)
    },
    onError: (err: Error) => setError(err.message),
  })

  function close() {
    if (save.isPending) return
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <SheetContent side="right">
        <div className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>{t('teamRolesCreateTitle')}</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-6">
            <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
              {t('teamRolesWizardStepLabel', { step, total: TOTAL_STEPS })}
            </p>

            {step === 1 ? (
              <div className="space-y-6">
                <SheetDescription className="sr-only">{t('teamRolesWizardNameHint')}</SheetDescription>
                <div className={FORM_GRID}>
                  <Label htmlFor="new-role-name" className="sm:pt-2">
                    {t('teamRolesNameLabel')}
                  </Label>
                  <Input
                    id="new-role-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={save.isPending}
                  />
                </div>
                <div className={FORM_GRID}>
                  <p className="text-sm font-medium sm:pt-3">{t('teamRolesPermissionsLabel')}</p>
                  <PermissionGroupToggles
                    lang={lang}
                    permissions={permissions}
                    onChange={setPermissions}
                    enabledModuleIds={me?.modules ?? []}
                    disabled={save.isPending}
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-3">
                <SheetDescription className="sr-only">{t('teamRolesWizardUsersHint')}</SheetDescription>
                <div className={FORM_GRID}>
                  <p className="text-sm font-medium sm:pt-2">{t('teamRolesWizardConfirmUsers')}</p>
                  {candidates.length === 0 ? (
                    <p className="text-sm text-text-secondary sm:pt-2">
                      {t('teamRolesWizardUsersEmpty')}
                    </p>
                  ) : (
                    <AssignMembersCombobox
                      candidates={candidates}
                      selectedIds={userIds}
                      onChange={setUserIds}
                      disabled={save.isPending}
                      placeholder={t('teamRolesWizardMembersPlaceholder')}
                      searchPlaceholder={t('teamRolesWizardMembersSearch')}
                      emptySearchLabel={t('teamRolesWizardMembersEmptySearch')}
                      removeLabel={t('teamRolesWizardRemoveMember')}
                      currentRoleLabel={(role) => t('teamRolesWizardMemberCurrentRole', { role })}
                    />
                  )}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <SheetDescription className="sr-only">
                  {t('teamRolesWizardConfirmHint')}
                </SheetDescription>
                <div className="divide-y divide-border-subtle">
                  <RoleSummaryField label={t('teamRolesNameLabel')}>
                    <p className="text-sm text-text-primary">
                      {name.trim() || t('teamRolesWizardPreviewEmptyName')}
                    </p>
                  </RoleSummaryField>
                  <RoleSummaryField label={t('teamRolesPermissionsLabel')}>
                    <GrantedPermissionTree
                      groups={groups}
                      t={t}
                      emptyLabel={t('teamRolesWizardConfirmNoPermissions')}
                    />
                  </RoleSummaryField>
                  <RoleSummaryField label={t('teamRolesWizardConfirmUsers')}>
                    {selectedMembers.length === 0 ? (
                      <p className="text-sm text-text-secondary">{t('teamRolesWizardConfirmNone')}</p>
                    ) : (
                      <ul className="space-y-2">
                        {selectedMembers.map((member) => (
                          <li
                            key={member.user_id}
                            className="rounded-md border border-border-subtle px-3 py-2"
                          >
                            <p className="text-sm font-medium text-text-primary">
                              {memberDisplayName(member)}
                            </p>
                            <p className="mt-0.5 text-xs text-text-tertiary">
                              {member.email} ·{' '}
                              {t('teamRolesWizardMemberCurrentRole', { role: member.role_name })}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </RoleSummaryField>
                </div>
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </SheetBody>
          <SheetFooter>
            {step === 1 ? (
              <Button type="button" variant="outline" onClick={close} disabled={save.isPending}>
                {t('teamInviteCancel')}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={save.isPending}
                onClick={() => {
                  setError(null)
                  setStep((step - 1) as Step)
                }}
              >
                {t('teamRolesWizardBack')}
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                variant="accent"
                disabled={step === 1 && !name.trim()}
                onClick={() => {
                  setError(null)
                  setStep((step + 1) as Step)
                }}
              >
                {t('teamRolesWizardNext')}
              </Button>
            ) : (
              <Button
                type="button"
                variant="accent"
                disabled={!name.trim()}
                loading={save.isPending}
                onClick={() => save.mutate()}
              >
                {t('teamRolesWizardCreate')}
              </Button>
            )}
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
