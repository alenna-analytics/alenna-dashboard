import { useAuth } from '@clerk/react'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { INVITE_EMAILS_MAX, parseInviteEmails } from '@/lib/email'
import { TeamRoleOptionList } from '@/components/team/team-role-option-list'
import { inviteTeamMember } from '@/lib/team/team-api'
import { defaultInviteRoleId, selectableWorkspaceRoles } from '@/lib/team/team-role-options'
import { shellT } from '@/lib/i18n/shell-strings'
import type { WorkspaceRole } from '@/lib/types/team-types'
import { cn } from '@/lib/utils'
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
    (key: Parameters<typeof shellT>[1], vars?: Record<string, string | number>) =>
      shellT(lang, key, vars),
    [lang],
  )

  const allowed = useMemo(
    () => selectableWorkspaceRoles(roles, { isOwner, lockToOwner: false }),
    [roles, isOwner],
  )
  const fallbackRoleId = defaultInviteRoleId(roles, isOwner)
  const [emailsRaw, setEmailsRaw] = useState('')
  const [roleId, setRoleId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const selectedRoleId =
    roleId && allowed.some((role) => role.id === roleId) ? roleId : fallbackRoleId

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseInviteEmails(emailsRaw)
      if (parsed.invalid.length > 0) {
        throw new Error(t('teamInviteEmailsInvalid', { emails: parsed.invalid.join(', ') }))
      }
      if (parsed.emails.length === 0) {
        throw new Error(t('teamInviteEmailInvalid'))
      }
      if (parsed.emails.length > INVITE_EMAILS_MAX) {
        throw new Error(t('teamInviteEmailsTooMany', { max: INVITE_EMAILS_MAX }))
      }
      for (const email of parsed.emails) {
        await inviteTeamMember(
          getToken,
          tenantId,
          { email, role_id: selectedRoleId },
          lang,
        )
      }
    },
    onSuccess: () => {
      setEmailsRaw('')
      setRoleId('')
      setError(null)
      onSuccess()
      onOpenChange(false)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const invitesLocked = !invitesEnabled
  const canSubmit =
    emailsRaw.trim().length > 0 &&
    invitesEnabled &&
    Boolean(selectedRoleId) &&
    !inviteMutation.isPending
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

          <SheetBody className="space-y-5">
            <SheetDescription>{t('teamInviteSheetDescription')}</SheetDescription>

            <div className="space-y-2">
              <Label>{t('teamInviteRoleLabel')}</Label>
              <TeamRoleOptionList
                roles={allowed}
                selectedRoleId={selectedRoleId}
                disabled={inviteMutation.isPending || invitesLocked}
                onSelect={setRoleId}
                t={t}
              />
              <Link
                to="/dashboard/team/roles"
                className="inline-block text-xs text-text-secondary underline underline-offset-2 hover:text-text-primary"
                onClick={() => onOpenChange(false)}
              >
                {t('teamInviteLearnRoles')}
              </Link>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-invite-emails">{t('teamInviteEmailLabel')}</Label>
              <textarea
                id="team-invite-emails"
                value={emailsRaw}
                onChange={(e) => {
                  setEmailsRaw(e.target.value)
                  setError(null)
                }}
                placeholder={t('teamInviteEmailPlaceholder')}
                autoComplete="off"
                disabled={inviteMutation.isPending || invitesLocked}
                rows={4}
                className={cn(
                  'w-full min-w-0 resize-y rounded-md border border-border-default bg-white px-2 py-2 text-sm outline-none',
                  'placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/45',
                  'disabled:cursor-not-allowed disabled:bg-glass-fill-subtle disabled:opacity-50',
                )}
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
