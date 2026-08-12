import { useAuth } from '@clerk/react'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import { updateTeamMemberRole } from '@/lib/team/team-api'
import {
  selectableTeamRoles,
  TEAM_ROLE_OPTIONS,
} from '@/lib/team/team-role-options'
import { shellT } from '@/lib/i18n/shell-strings'
import type { TeamMember, TeamRoleSlug } from '@/lib/types/team-types'
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

type EditTeamMemberRoleSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  actorRole: string
  member: TeamMember
  /** When true, demoting the last owner is blocked by filtering roles. */
  isLastOwner: boolean
  onSuccess: () => void
}

function initialRoleForMember(
  member: TeamMember,
  allowed: TeamRoleSlug[],
): TeamRoleSlug {
  if (allowed.includes(member.role)) return member.role
  return allowed[0] ?? 'staff'
}

export function EditTeamMemberRoleSheet({
  open,
  onOpenChange,
  tenantId,
  actorRole,
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

  const allowed = useMemo(() => {
    const base = selectableTeamRoles(actorRole)
    if (isLastOwner && member.role === 'owner') {
      return base.filter((role) => role === 'owner')
    }
    return base
  }, [actorRole, isLastOwner, member.role])

  const [role, setRole] = useState<TeamRoleSlug>(() =>
    initialRoleForMember(member, allowed),
  )
  const [error, setError] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!member.user_id) throw new Error('missing member')
      return updateTeamMemberRole(getToken, tenantId, member.user_id, role, lang)
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
  const unchanged = role === member.role

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
              <div className="space-y-2">
                {TEAM_ROLE_OPTIONS.filter((opt) => allowed.includes(opt.id)).map((opt) => {
                  const selected = role === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() => setRole(opt.id)}
                      className={cn(
                        'w-full rounded-md border px-3 py-3 text-left transition-colors',
                        selected
                          ? 'border-[var(--firefly-base)] bg-muted/40'
                          : 'border-border-subtle hover:bg-muted/20',
                      )}
                    >
                      <p className="text-sm font-medium text-text-primary">{t(opt.titleKey)}</p>
                      <p className="mt-1 text-xs leading-snug text-text-secondary">
                        {t(opt.descriptionKey)}
                      </p>
                    </button>
                  )
                })}
              </div>
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
