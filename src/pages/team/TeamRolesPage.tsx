import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreVertical, Pencil, Plus, Trash2, Lock, Eye } from 'lucide-react'
import { useCallback, useState } from 'react'

import { CreateWorkspaceRoleWizard } from '@/components/team/create-workspace-role-wizard'
import { CustomRolesUpgradeDialog } from '@/components/team/custom-roles-upgrade-dialog'
import { EditWorkspaceRoleSheet } from '@/components/team/edit-workspace-role-sheet'
import {
  deleteWorkspaceRole,
  fetchTeamMembers,
  fetchWorkspaceRoles,
} from '@/lib/team/team-api'
import { sortWorkspaceRoles } from '@/lib/team/team-role-options'
import { isOwner } from '@/lib/permissions/can'
import { shellT } from '@/lib/i18n/shell-strings'
import { shouldShowCustomRolesUpgrade } from '@/pages/team/team-roles-paywall'
import { cn } from '@/lib/utils'
import type { WorkspaceRole } from '@/lib/types/team-types'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
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
import { Skeleton } from '@/ui/skeleton'

export function TeamRolesPage() {
  const { getToken } = useAuth()
  const { me } = useWorkspace()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )

  const tenantId = me?.tenant_id ?? null
  const actorIsOwner = isOwner(me)
  const [createOpen, setCreateOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [editRole, setEditRole] = useState<WorkspaceRole | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rolesQuery = useQuery({
    queryKey: ['workspace-roles', tenantId],
    enabled: Boolean(tenantId),
    queryFn: () => fetchWorkspaceRoles(getToken, tenantId!, lang),
  })
  const membersQuery = useQuery({
    queryKey: ['team-members', tenantId],
    enabled: Boolean(tenantId) && actorIsOwner,
    queryFn: () => fetchTeamMembers(getToken, tenantId!, lang),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['workspace-roles', tenantId] })
    void queryClient.invalidateQueries({ queryKey: ['team-members', tenantId] })
  }

  const deleteMutation = useMutation({
    mutationFn: (roleId: string) => {
      const staffId =
        rolesQuery.data?.roles.find((role) => role.system_key === 'staff')?.id ?? null
      return deleteWorkspaceRole(getToken, tenantId!, roleId, staffId, lang)
    },
    onSuccess: () => {
      setError(null)
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const roles = sortWorkspaceRoles(rolesQuery.data?.roles ?? [])
  const canManageRoles = Boolean(rolesQuery.data?.can_manage_roles)
  const atLimit =
    rolesQuery.data?.roles_limit != null &&
    rolesQuery.data.roles_used >= rolesQuery.data.roles_limit
  const showSkeleton = rolesQuery.isLoading && rolesQuery.data === undefined

  const showUpgrade = shouldShowCustomRolesUpgrade(actorIsOwner, canManageRoles)

  return (
    <DashboardPage>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={pageTitleClassName}>{t('teamRolesPageTitle')}</h1>
            {rolesQuery.data ? (
              <p className="mt-1 text-sm text-text-tertiary">
                {t('teamRolesUsed')
                  .replace('{used}', String(rolesQuery.data.roles_used))
                  .replace(
                    '{limit}',
                    rolesQuery.data.roles_limit == null
                      ? '∞'
                      : String(rolesQuery.data.roles_limit),
                  )}
              </p>
            ) : null}
          </div>
          {actorIsOwner ? (
            <Button
              type="button"
              variant="accent"
              size="tiny"
              disabled={!showUpgrade && atLimit}
              onClick={() => {
                if (showUpgrade) {
                  setUpgradeOpen(true)
                  return
                }
                setCreateOpen(true)
              }}
            >
              <Plus aria-hidden />
              {t('teamRolesCreate')}
            </Button>
          ) : null}
        </div>

        {canManageRoles && atLimit ? (
          <p className="text-sm text-text-secondary">{t('teamRolesLimitReached')}</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="overflow-x-auto rounded-md border border-border-subtle">
          <table className="w-full min-w-lg text-left text-sm">
            {showSkeleton || roles.length > 0 ? (
              <thead>
                <tr className="border-b border-border-subtle font-numeric text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="px-4 py-3">{t('teamRolesNameLabel')}</th>
                  <th className="px-4 py-3">{t('teamColumnType')}</th>
                  <th className="px-4 py-3">{t('teamColumnMembers')}</th>
                  <th className="px-4 py-3">{t('teamColumnInvitations')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
            ) : null}
            <tbody>
              {showSkeleton
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="border-b border-border-subtle last:border-0">
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-8" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-8" />
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  ))
                : null}

              {!showSkeleton
                ? roles.map((role) => (
                    <tr key={role.id} className="border-b border-border-subtle last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="font-medium text-text-primary">{role.name}</p>
                          {role.system_key === 'owner' ? (
                            <span
                              className="inline-flex"
                              title={t('teamRolesOwnerLocked')}
                            >
                              <Lock
                                className="size-3.5 shrink-0 text-text-tertiary"
                                aria-label={t('teamRolesOwnerLocked')}
                              />
                            </span>
                          ) : null}
                        </div>
                        {role.description ? (
                          <p className="text-xs text-text-tertiary">{role.description}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {role.system_key
                            ? t('teamRoleTypeSystem')
                            : t('teamRoleTypeCustom')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-primary">{role.member_count}</td>
                      <td className="px-4 py-3 text-text-primary">{role.invitation_count}</td>
                      <td className="px-4 py-3 text-right">
                        {actorIsOwner ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className={cn(
                                'inline-flex size-8 items-center justify-center rounded-full border border-transparent text-foreground outline-none',
                                'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30',
                              )}
                              aria-label={t('teamActions')}
                              disabled={deleteMutation.isPending}
                            >
                              <MoreVertical className="size-4 shrink-0" aria-hidden />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>{t('teamActions')}</DropdownMenuLabel>
                              </DropdownMenuGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                {role.system_key === 'owner' || showUpgrade ? (
                                  <DropdownMenuItem onClick={() => setEditRole(role)}>
                                    <Eye className="h-4 w-4" aria-hidden />
                                    <span>{t('teamViewRoleAction')}</span>
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => setEditRole(role)}>
                                    <Pencil className="h-4 w-4" aria-hidden />
                                    <span>{t('teamEditRoleAction')}</span>
                                  </DropdownMenuItem>
                                )}
                                {showUpgrade && role.system_key !== 'owner' ? (
                                  <DropdownMenuItem onClick={() => setUpgradeOpen(true)}>
                                    <Pencil className="h-4 w-4" aria-hidden />
                                    <span>{t('teamEditRoleAction')}</span>
                                  </DropdownMenuItem>
                                ) : null}
                                {role.system_key == null && canManageRoles ? (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => deleteMutation.mutate(role.id)}
                                  >
                                    <Trash2 className="h-4 w-4" aria-hidden />
                                    <span>{t('teamRolesDelete')}</span>
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </td>
                    </tr>
                  ))
                : null}

              {!showSkeleton && roles.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState icon="orgs" title={t('teamRolesEmpty')} />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {me && actorIsOwner ? (
        <CustomRolesUpgradeDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          me={me}
          lang={lang}
          badge="Growth"
          title={t('teamRolesUpgradeTitle')}
          description={t('teamRolesUpgradeCopy')}
        />
      ) : null}

      {tenantId && actorIsOwner && canManageRoles ? (
        <CreateWorkspaceRoleWizard
          open={createOpen}
          onOpenChange={setCreateOpen}
          tenantId={tenantId}
          members={membersQuery.data?.members ?? []}
          onSuccess={invalidate}
        />
      ) : null}

      {tenantId && editRole ? (
        <EditWorkspaceRoleSheet
          key={editRole.id}
          open
          onOpenChange={(open) => {
            if (!open) setEditRole(null)
          }}
          tenantId={tenantId}
          role={editRole}
          planLocked={showUpgrade}
          onSuccess={invalidate}
        />
      ) : null}
    </DashboardPage>
  )
}
