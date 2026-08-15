import { useAuth } from '@clerk/react'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import { createWorkspaceRole, updateTeamMemberRole } from '@/lib/team/team-api'
import { memberDisplayName } from '@/lib/team/member-display-name'
import { PermissionGroupToggles } from '@/components/team/permission-group-toggles'
import { shellT } from '@/lib/i18n/shell-strings'
import type { TeamMember } from '@/lib/types/team-types'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { Checkbox } from '@/ui/checkbox'
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
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [userIds, setUserIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const candidates = useMemo(() => assignableMembers(members), [members])

  function reset() {
    setStep(1)
    setName('')
    setDescription('')
    setPermissions([])
    setUserIds([])
    setError(null)
  }

  const save = useMutation({
    mutationFn: async () => {
      const role = await createWorkspaceRole(
        getToken,
        tenantId,
        { name: name.trim(), description: description.trim() || null, permissions },
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
          <SheetBody className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
              {t('teamRolesWizardStepLabel', { step, total: 3 })}
            </p>
            <div className="flex gap-1.5">
              {([1, 2, 3] as const).map((n) => (
                <div
                  key={n}
                  className={cn(
                    'h-1.5 flex-1 rounded-full',
                    n <= step ? 'bg-brand' : 'bg-neutral-200',
                  )}
                />
              ))}
            </div>

            {step === 1 ? (
              <div className="space-y-4">
                <SheetDescription>{t('teamRolesWizardNameHint')}</SheetDescription>
                <div className="space-y-2">
                  <Label htmlFor="new-role-name">{t('teamRolesNameLabel')}</Label>
                  <Input
                    id="new-role-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={save.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-role-desc">{t('teamRolesDescriptionLabel')}</Label>
                  <Input
                    id="new-role-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={save.isPending}
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-3">
                <SheetDescription>{t('teamRolesWizardPermissionsHint')}</SheetDescription>
                <PermissionGroupToggles
                  lang={lang}
                  permissions={permissions}
                  onChange={setPermissions}
                  enabledModuleIds={me?.modules ?? []}
                  disabled={save.isPending}
                />
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-3">
                <SheetDescription>{t('teamRolesWizardUsersHint')}</SheetDescription>
                {candidates.length === 0 ? (
                  <p className="text-sm text-text-secondary">{t('teamRolesWizardUsersEmpty')}</p>
                ) : (
                  <ul className="space-y-2">
                    {candidates.map((member) => {
                      const id = member.user_id!
                      const checked = userIds.includes(id)
                      return (
                        <li key={id}>
                          <label className="flex items-start gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(next) => {
                                setUserIds((prev) =>
                                  next ? [...prev, id] : prev.filter((item) => item !== id),
                                )
                              }}
                              disabled={save.isPending}
                            />
                            <span>
                              <span className="font-medium text-text-primary">
                                {memberDisplayName(member)}
                              </span>
                              <span className="mt-0.5 block text-xs text-text-tertiary">
                                {member.email} · {member.role_name}
                              </span>
                            </span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                )}
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
            {step < 3 ? (
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
