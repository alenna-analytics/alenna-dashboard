import { useAuth } from '@clerk/react'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import { TeamRoleOptionList } from '@/components/team/team-role-option-list'
import { updateTeamMemberRole } from '@/lib/team/team-api'
import { selectableWorkspaceRoles } from '@/lib/team/team-role-options'
import { shellT } from '@/lib/i18n/shell-strings'
import type { TeamMember, WorkspaceRole } from '@/lib/types/team-types'
import { useLanguage } from '@/shell/providers/language-provider'
import { Button } from '@/ui/button'
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

type EditTeamMemberRoleSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  isOwner: boolean
  roles: WorkspaceRole[]
  member: TeamMember
  isLastOwner: boolean
  onSuccess: () => void
}

export function EditTeamMemberRoleSheet({
  open,
  onOpenChange,
  tenantId,
  isOwner,
  roles,
  member,
  isLastOwner,
  onSuccess,
}: EditTeamMemberRoleSheetProps) {
  const { getToken } = useAuth()
  const { lang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )

  const allowed = useMemo(
    () =>
      selectableWorkspaceRoles(roles, {
        isOwner,
        lockToOwner: isLastOwner && member.role === 'owner',
      }),
    [roles, isOwner, isLastOwner, member.role],
  )

  const [roleId, setRoleId] = useState(() => member.role_id)
  const [error, setError] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!member.user_id) throw new Error('missing member')
      return updateTeamMemberRole(getToken, tenantId, member.user_id, roleId, lang)
    },
    onSuccess: () => {
      setError(null)
      onSuccess()
      onOpenChange(false)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const memberLabel =
    [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email
  const unchanged = roleId === member.role_id

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <div className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>{t('teamEditRoleSheetTitle')}</SheetTitle>
          </SheetHeader>

          <SheetBody className="space-y-4">
            <SheetDescription>
              {t('teamEditRoleSheetDescription').replace('{name}', memberLabel)}
            </SheetDescription>

            <div className="space-y-2">
              <Label>{t('teamInviteRoleLabel')}</Label>
              <TeamRoleOptionList
                roles={allowed}
                selectedRoleId={roleId}
                disabled={updateMutation.isPending}
                onSelect={setRoleId}
                t={t}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </SheetBody>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              {t('teamInviteCancel')}
            </Button>
            <Button
              type="button"
              variant="accent"
              disabled={unchanged || !member.user_id}
              loading={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {t('teamEditRoleSubmit')}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
