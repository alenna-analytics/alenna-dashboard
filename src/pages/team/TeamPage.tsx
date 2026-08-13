import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Ban,
  LogOut,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { fetchMyTenants, useTenantSwitcher } from '@/auth/hooks'
import { EditTeamMemberRoleSheet } from '@/components/team/edit-team-member-role-sheet'
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
import {
  TeamConfirmDialog,
  type TeamConfirmKind,
} from '@/pages/team/team-confirm-dialog'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Badge } from '@/ui/badge'
import { Button, buttonVariants } from '@/ui/button'
import { EmptyState } from '@/ui/empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { Input } from '@/ui/input'
import { Skeleton } from '@/ui/skeleton'
import { DisabledTooltip } from '@/ui/tooltip'

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

type RowAction = {
  key: string
  label: string
  icon: LucideIcon
  destructive?: boolean
  onSelect: () => void
}

export function TeamPage() {
  const { getToken } = useAuth()
  const { me, refetchTenants } = useWorkspace()
  const { switchTenant } = useTenantSwitcher()
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )

  const [filter, setFilter] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editMember, setEditMember] = useState<TeamMember | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)

  const tenantId = me?.tenant_id ?? null
  const canManage = canManageTeam(me?.role)
  const invitesEnabled = me?.team_invites_enabled !== false && !me?.is_fixture

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
    onSuccess: async () => {
      setPendingConfirm(null)
      const leftTenantId = tenantId!
      try {
        const tenants = await fetchMyTenants(getToken)
        const remaining = tenants.filter((row) => row.tenant_id !== leftTenantId)
        if (remaining.length === 0) {
          refetchTenants()
          navigate('/onboarding', { replace: true })
          return
        }
        await switchTenant(remaining[0].tenant_id)
        refetchTenants()
        navigate('/dashboard', { replace: true })
      } catch {
        refetchTenants()
        navigate('/onboarding', { replace: true })
      }
    },
  })

  const members = useMemo(() => teamQuery.data?.members ?? [], [teamQuery.data?.members])
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return members
    return members.filter((m) => {
      const hay = `${memberDisplayName(m)} ${m.email} ${m.role_name}`.toLowerCase()
      return hay.includes(q)
    })
  }, [filter, members])

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

  const showSkeleton = teamQuery.isLoading && teamQuery.data === undefined

  function rowActions(member: TeamMember): RowAction[] {
    const actions: RowAction[] = []

    if (member.is_you && canLeaveTeam) {
      actions.push({
        key: 'leave',
        label: t('teamLeaveAction'),
        icon: LogOut,
        destructive: true,
        onSelect: () => setPendingConfirm({ kind: 'leave' }),
      })
    }

    if (!member.is_you && canManage && member.status === 'pending' && member.invitation_id) {
      actions.push({
        key: 'revoke',
        label: t('teamRevokeInvite'),
        icon: Ban,
        destructive: true,
        onSelect: () => revokeMutation.mutate(member.invitation_id!),
      })
    }

    if (!member.is_you && canManage && member.status === 'active' && member.user_id) {
      const targetIsOwner = isOwnerRole(member.role)
      const actorIsOwner = isOwnerRole(me?.role ?? '')
      const canModify = !targetIsOwner || actorIsOwner
      if (canModify) {
        actions.push({
          key: 'edit',
          label: t('teamEditRoleAction'),
          icon: Pencil,
          onSelect: () => setEditMember(member),
        })
      }
      const wouldLeaveNoOwner = targetIsOwner && ownerCount <= 1
      if (canModify && !wouldLeaveNoOwner) {
        actions.push({
          key: 'remove',
          label: t('teamRemoveMember'),
          icon: Trash2,
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
  }

  const confirmKind: TeamConfirmKind =
    pendingConfirm?.kind === 'remove' ? 'remove' : 'leave'
  const confirmPending =
    pendingConfirm?.kind === 'leave'
      ? leaveMutation.isPending
      : removeMutation.isPending
  const editingLastOwner =
    editMember != null && isOwnerRole(editMember.role) && ownerCount <= 1

  return (
    <DashboardPage>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className={pageTitleClassName}>{t('navTeam')}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {canManage ? (
              <DisabledTooltip
                reason={!invitesEnabled ? t('teamInviteDisabledTooltip') : null}
              >
                <Button
                  type="button"
                  variant="accent"
                  size="default"
                  className="shrink-0"
                  disabled={atSeatLimit || !invitesEnabled}
                  onClick={() => setInviteOpen(true)}
                >
                  <UserPlus aria-hidden />
                  {t('teamInviteMembers')}
                </Button>
              </DisabledTooltip>
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

        <div className="relative w-72 shrink-0">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('teamFilterPlaceholder')}
            aria-label={t('teamFilterPlaceholder')}
            className="h-[33px] border-border-default bg-white pl-8 text-xs placeholder:text-xs focus-visible:border-border-emphasis focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {filter.trim() ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="absolute top-1/2 right-0.5 z-10 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={t('filterClear')}
              onClick={() => setFilter('')}
            >
              <X className="size-4 shrink-0" aria-hidden />
            </Button>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-md border border-border-subtle">
          <table className="w-full min-w-lg text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-3">{t('teamColumnMember')}</th>
                <th className="px-4 py-3">{t('teamColumnRole')}</th>
                <th className="px-4 py-3">{t('teamColumnStatus')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {showSkeleton
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="border-b border-border-subtle last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-56" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  ))
                : null}

              {!showSkeleton
                ? filtered.map((member) => {
                    const actions = rowActions(member)
                    return (
                      <tr
                        key={member.invitation_id ?? member.user_id ?? member.email}
                        className="border-b border-border-subtle last:border-0"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-primary">
                              {memberDisplayName(member)}
                            </span>
                            {member.is_you ? (
                              <Badge variant="secondary">{t('teamYouBadge')}</Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-text-tertiary">{member.email}</p>
                        </td>
                        <td className="px-4 py-3 text-text-primary">{member.role_name}</td>
                        <td className="px-4 py-3">
                          <Badge variant={member.status === 'pending' ? 'secondary' : 'success'}>
                            {member.status === 'pending'
                              ? t('teamStatusPending')
                              : t('teamStatusActive')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {actions.length > 0 ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className={cn(
                                  'inline-flex size-8 items-center justify-center rounded-full border border-transparent text-foreground outline-none',
                                  'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30',
                                )}
                                aria-label={t('teamActions')}
                                disabled={actionsBusy}
                              >
                                <MoreVertical className="size-4 shrink-0" aria-hidden />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>{t('teamActions')}</DropdownMenuLabel>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  {actions.map((action) => {
                                    const Icon = action.icon
                                    return (
                                      <DropdownMenuItem
                                        key={action.key}
                                        variant={action.destructive ? 'destructive' : 'default'}
                                        onClick={action.onSelect}
                                      >
                                        <Icon className="size-4 shrink-0" aria-hidden />
                                        {action.label}
                                      </DropdownMenuItem>
                                    )
                                  })}
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })
                : null}

              {!showSkeleton && filtered.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState title={t('teamEmpty')} />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-text-tertiary">
          {t('teamMemberCount').replace('{count}', String(activeCount))}
          {teamQuery.data ? (
            <>
              {' · '}
              {formatPlanLimit(teamQuery.data.users_used, lang)}
              {' / '}
              {formatPlanLimit(teamQuery.data.users_limit, lang)}
            </>
          ) : null}
        </p>
      </div>

      {tenantId && me ? (
        <InviteTeamMemberSheet
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          tenantId={tenantId}
          actorRole={me.role}
          invitesEnabled={invitesEnabled}
          onSuccess={invalidate}
        />
      ) : null}

      {tenantId && me && editMember ? (
        <EditTeamMemberRoleSheet
          key={editMember.user_id ?? editMember.email}
          open
          onOpenChange={(open) => {
            if (!open) setEditMember(null)
          }}
          tenantId={tenantId}
          actorRole={me.role}
          member={editMember}
          isLastOwner={editingLastOwner}
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
