import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { InviteTeamMemberSheet } from '@/components/team/invite-team-member-sheet'
import {
  fetchTeamMembers,
  leaveTeam,
  removeTeamMember,
  revokeTeamInvitation,
} from '@/lib/team/team-api'
import { shellT } from '@/lib/i18n/shell-strings'
import { formatPlanLimit, UPGRADE_ENTERPRISE_MAILTO } from '@/lib/plan/plan-limit-ui'
import type { TeamMember } from '@/lib/types/team-types'
import { cn } from '@/lib/utils'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button, buttonVariants } from '@/ui/button'
import {
  TeamConfirmDialog,
  type TeamConfirmKind,
} from '@/pages/team/team-confirm-dialog'
import {
  TeamMembersTable,
  type TeamMemberRowAction,
} from '@/pages/team/team-members-table'

function memberDisplayName(member: TeamMember): string {
  const parts = [member.first_name, member.last_name].filter(Boolean)
  if (parts.length > 0) return parts.join(' ')
  return member.email
}

function canManageTeam(role: string | undefined): boolean {
  const normalized = role?.trim().toLowerCase() ?? ''
  return normalized === 'owner' || normalized === 'admin'
}

function isOwnerRole(role: string): boolean {
  return role.trim().toLowerCase() === 'owner'
}

type PendingConfirm =
  | { kind: 'leave' }
  | { kind: 'remove'; userId: string; memberName: string }

export function TeamPage() {
  const { getToken } = useAuth()
  const { me } = useWorkspace()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )

  const [filter, setFilter] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)

  const tenantId = me?.tenant_id ?? null
  const canManage = canManageTeam(me?.role)

  const teamQuery = useQuery({
    queryKey: ['team-members', tenantId],
    enabled: Boolean(tenantId),
    queryFn: () => fetchTeamMembers(getToken, tenantId!, lang),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['team-members', tenantId] })

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) =>
      revokeTeamInvitation(getToken, tenantId!, invitationId, lang),
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeTeamMember(getToken, tenantId!, userId, lang),
    onSuccess: () => {
      setPendingConfirm(null)
      invalidate()
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => leaveTeam(getToken, tenantId!, lang),
    onSuccess: () => {
      setPendingConfirm(null)
      invalidate()
    },
  })

  const members = useMemo(() => teamQuery.data?.members ?? [], [teamQuery.data?.members])

  const atSeatLimit =
    teamQuery.data?.users_limit != null &&
    teamQuery.data.users_used >= teamQuery.data.users_limit

  const activeMembers = members.filter((m) => m.status === 'active')
  const activeCount = activeMembers.length
  const ownerCount = activeMembers.filter((m) => isOwnerRole(m.role)).length
  const canLeaveTeam =
    activeCount > 1 && !(isOwnerRole(me?.role ?? '') && ownerCount <= 1)

  const actionsBusy =
    leaveMutation.isPending || revokeMutation.isPending || removeMutation.isPending

  const getRowActions = useCallback(
    (member: TeamMember): TeamMemberRowAction[] => {
      const actions: TeamMemberRowAction[] = []

      if (member.is_you && canLeaveTeam) {
        actions.push({
          key: 'leave',
          label: t('teamLeaveAction'),
          destructive: true,
          onSelect: () => setPendingConfirm({ kind: 'leave' }),
        })
      }

      if (!member.is_you && canManage && member.status === 'pending' && member.invitation_id) {
        actions.push({
          key: 'revoke',
          label: t('teamRevokeInvite'),
          destructive: true,
          onSelect: () => revokeMutation.mutate(member.invitation_id!),
        })
      }

      if (!member.is_you && canManage && member.status === 'active' && member.user_id) {
        const targetIsOwner = isOwnerRole(member.role)
        const actorIsOwner = isOwnerRole(me?.role ?? '')
        const wouldLeaveNoOwner = targetIsOwner && ownerCount <= 1
        if ((!targetIsOwner || actorIsOwner) && !wouldLeaveNoOwner) {
          actions.push({
            key: 'remove',
            label: t('teamRemoveMember'),
            destructive: true,
            onSelect: () =>
              setPendingConfirm({
                kind: 'remove',
                userId: member.user_id!,
                memberName: memberDisplayName(member),
              }),
          })
        }
      }

      return actions
    },
    [canLeaveTeam, canManage, me?.role, ownerCount, revokeMutation, t],
  )

  const confirmKind: TeamConfirmKind =
    pendingConfirm?.kind === 'remove' ? 'remove' : 'leave'
  const confirmPending =
    pendingConfirm?.kind === 'leave'
      ? leaveMutation.isPending
      : removeMutation.isPending

  return (
    <DashboardPage>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className={pageTitleClassName}>{t('navTeam')}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {canManage ? (
              <Button
                type="button"
                variant="accent"
                size="default"
                className="shrink-0"
                disabled={atSeatLimit}
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus aria-hidden />
                {t('teamInviteMembers')}
              </Button>
            ) : null}
          </div>
        </div>

        {atSeatLimit ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p>{t('teamSeatLimitBanner')}</p>
            {teamQuery.data?.upgrade_cta === 'growth' ? (
              <p className="mt-1 text-xs">{t('teamSeatLimitUpgradeGrowth')}</p>
            ) : null}
            {teamQuery.data?.upgrade_cta === 'enterprise' ? (
              <a
                href={UPGRADE_ENTERPRISE_MAILTO}
                className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'mt-1 h-auto p-0')}
              >
                {t('planUpgradeToEnterprise')}
              </a>
            ) : null}
          </div>
        ) : null}

        <TeamMembersTable
          rows={members}
          searchQ={filter}
          onSearchChange={setFilter}
          isLoading={teamQuery.isLoading}
          isFetching={teamQuery.isFetching}
          hasEverLoaded={teamQuery.data !== undefined}
          actionsBusy={actionsBusy}
          getRowActions={getRowActions}
          t={t}
          footer={
            <>
              {t('teamMemberCount').replace('{count}', String(activeCount))}
              {teamQuery.data ? (
                <>
                  {' · '}
                  {formatPlanLimit(teamQuery.data.users_used, lang)}
                  {' / '}
                  {formatPlanLimit(teamQuery.data.users_limit, lang)}
                </>
              ) : null}
            </>
          }
        />
      </div>

      {tenantId && me ? (
        <InviteTeamMemberSheet
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          tenantId={tenantId}
          actorRole={me.role}
          onSuccess={invalidate}
        />
      ) : null}

      <TeamConfirmDialog
        open={pendingConfirm != null}
        onOpenChange={(open) => {
          if (!open && !confirmPending) setPendingConfirm(null)
        }}
        kind={confirmKind}
        memberName={
          pendingConfirm?.kind === 'remove' ? pendingConfirm.memberName : undefined
        }
        pending={confirmPending}
        onConfirm={() => {
          if (pendingConfirm?.kind === 'leave') {
            leaveMutation.mutate()
            return
          }
          if (pendingConfirm?.kind === 'remove') {
            removeMutation.mutate(pendingConfirm.userId)
          }
        }}
        t={t}
      />
    </DashboardPage>
  )
}
