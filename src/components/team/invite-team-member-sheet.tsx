import { useAuth } from '@clerk/react'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import { EMAIL_MAX_LENGTH, isValidEmail } from '@/lib/email'
import { TeamRoleOptionList } from '@/components/team/team-role-option-list'
import { inviteTeamMember } from '@/lib/team/team-api'
import { defaultInviteRoleId, selectableWorkspaceRoles } from '@/lib/team/team-role-options'
import { shellT } from '@/lib/i18n/shell-strings'
import type { WorkspaceRole } from '@/lib/types/team-types'
import { useLanguage } from '@/shell/providers/language-provider'
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
import { DisabledTooltip } from '@/ui/tooltip'

type InviteTeamMemberSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  isOwner: boolean
  roles: WorkspaceRole[]
  invitesEnabled: boolean
  onSuccess: () => void
}

export function InviteTeamMemberSheet({
  open,
  onOpenChange,
  tenantId,
  isOwner,
  roles,
  invitesEnabled,
  onSuccess,
}: InviteTeamMemberSheetProps) {
  const { getToken } = useAuth()
  const { lang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )

  const allowed = useMemo(
    () => selectableWorkspaceRoles(roles, { isOwner, lockToOwner: false }),
    [roles, isOwner],
  )
  const fallbackRoleId = defaultInviteRoleId(roles, isOwner)
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const selectedRoleId =
    roleId && allowed.some((role) => role.id === roleId) ? roleId : fallbackRoleId

  const inviteMutation = useMutation({
    mutationFn: () =>
      inviteTeamMember(
        getToken,
        tenantId,
        { email: email.trim(), role_id: selectedRoleId },
        lang,
      ),
    onSuccess: () => {
      setEmail('')
      setRoleId('')
      setError(null)
      onSuccess()
      onOpenChange(false)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const emailValid = isValidEmail(email)
  const emailInvalid = email.trim().length > 0 && !emailValid
  const invitesLocked = !invitesEnabled
  const canSubmit =
    emailValid && invitesEnabled && Boolean(selectedRoleId) && !inviteMutation.isPending
  const lockedReason = useMemo(
    () => (invitesLocked ? t('teamInviteDisabledTooltip') : null),
    [invitesLocked, t],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <div className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>{t('teamInviteSheetTitle')}</SheetTitle>
          </SheetHeader>

          <SheetBody className="space-y-4">
            <SheetDescription>{t('teamInviteSheetDescription')}</SheetDescription>

            <div className="space-y-2">
              <Label htmlFor="team-invite-email">{t('teamInviteEmailLabel')}</Label>
              <Input
                id="team-invite-email"
                type="email"
                value={email}
                maxLength={EMAIL_MAX_LENGTH}
                onChange={(e) => {
                  setEmail(e.target.value.slice(0, EMAIL_MAX_LENGTH))
                  setError(null)
                }}
                placeholder={t('teamInviteEmailPlaceholder')}
                autoComplete="off"
                disabled={inviteMutation.isPending || invitesLocked}
                aria-invalid={emailInvalid}
                aria-describedby={emailInvalid ? 'team-invite-email-error' : undefined}
              />
              {emailInvalid ? (
                <p id="team-invite-email-error" className="text-xs text-destructive" role="status">
                  {t('teamInviteEmailInvalid')}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>{t('teamInviteRoleLabel')}</Label>
              <TeamRoleOptionList
                roles={allowed}
                selectedRoleId={selectedRoleId}
                disabled={inviteMutation.isPending || invitesLocked}
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
              disabled={inviteMutation.isPending}
            >
              {t('teamInviteCancel')}
            </Button>
            <DisabledTooltip reason={lockedReason}>
              <Button
                type="button"
                variant="accent"
                disabled={!canSubmit}
                loading={inviteMutation.isPending}
                onClick={() => inviteMutation.mutate()}
              >
                {t('teamInviteSubmit')}
              </Button>
            </DisabledTooltip>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
