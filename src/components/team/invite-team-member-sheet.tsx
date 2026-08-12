import { useAuth } from '@clerk/react'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import { inviteTeamMember } from '@/lib/team/team-api'
import { shellT } from '@/lib/i18n/shell-strings'
import type { TeamRoleSlug } from '@/lib/types/team-types'
import { cn } from '@/lib/utils'
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

type InviteTeamMemberSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  actorRole: string
  onSuccess: () => void
}

type RoleOption = {
  id: TeamRoleSlug
  titleKey: Parameters<typeof shellT>[1]
  descriptionKey: Parameters<typeof shellT>[1]
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'owner',
    titleKey: 'teamRoleOwnerTitle',
    descriptionKey: 'teamRoleOwnerDescription',
  },
  {
    id: 'admin',
    titleKey: 'teamRoleAdminTitle',
    descriptionKey: 'teamRoleAdminDescription',
  },
  {
    id: 'staff',
    titleKey: 'teamRoleStaffTitle',
    descriptionKey: 'teamRoleStaffDescription',
  },
]

function selectableRoles(actorRole: string): TeamRoleSlug[] {
  const normalized = actorRole.trim().toLowerCase()
  if (normalized === 'owner') return ['owner', 'admin', 'staff']
  if (normalized === 'admin') return ['admin', 'staff']
  return ['staff']
}

export function InviteTeamMemberSheet({
  open,
  onOpenChange,
  tenantId,
  actorRole,
  onSuccess,
}: InviteTeamMemberSheetProps) {
  const { getToken } = useAuth()
  const { lang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )

  const allowed = selectableRoles(actorRole)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamRoleSlug>(allowed.includes('admin') ? 'admin' : 'staff')
  const [error, setError] = useState<string | null>(null)

  const inviteMutation = useMutation({
    mutationFn: () => inviteTeamMember(getToken, tenantId, { email: email.trim(), role }, lang),
    onSuccess: () => {
      setEmail('')
      setError(null)
      onSuccess()
      onOpenChange(false)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

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
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('teamInviteEmailPlaceholder')}
                autoComplete="off"
                disabled={inviteMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('teamInviteRoleLabel')}</Label>
              <div className="space-y-2">
                {ROLE_OPTIONS.filter((opt) => allowed.includes(opt.id)).map((opt) => {
                  const selected = role === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={inviteMutation.isPending}
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
              disabled={inviteMutation.isPending}
            >
              {t('teamInviteCancel')}
            </Button>
            <Button
              type="button"
              variant="accent"
              disabled={!email.trim()}
              loading={inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
            >
              {t('teamInviteSubmit')}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
