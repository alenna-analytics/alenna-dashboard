import { useAuth } from '@clerk/react'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import { updateWorkspaceRole } from '@/lib/team/team-api'
import { PermissionGroupToggles } from '@/components/team/permission-group-toggles'
import { ASSIGNABLE_PERMISSION_KEYS } from '@/lib/permissions/can'
import { shellT } from '@/lib/i18n/shell-strings'
import type { WorkspaceRole } from '@/lib/types/team-types'
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

type EditWorkspaceRoleSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  role: WorkspaceRole
  onSuccess: () => void
}

export function EditWorkspaceRoleSheet({
  open,
  onOpenChange,
  tenantId,
  role,
  onSuccess,
}: EditWorkspaceRoleSheetProps) {
  const { getToken } = useAuth()
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )
  const locked = role.system_key === 'owner'
  const [name, setName] = useState(role.name)
  const [description, setDescription] = useState(role.description ?? '')
  const [permissions, setPermissions] = useState<string[]>(
    locked && (role.permissions == null || role.permissions.length === 0)
      ? [...ASSIGNABLE_PERMISSION_KEYS]
      : (role.permissions ?? []),
  )
  const [error, setError] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: () =>
      updateWorkspaceRole(
        getToken,
        tenantId,
        role.id,
        {
          name: name.trim(),
          description: description.trim() || null,
          permissions,
        },
        lang,
      ),
    onSuccess: () => {
      onSuccess()
      onOpenChange(false)
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <div className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>{locked ? t('teamRolesViewTitle') : t('teamRolesEditTitle')}</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            {locked ? (
              <SheetDescription>{t('teamRolesOwnerLocked')}</SheetDescription>
            ) : (
              <SheetDescription>{t('teamRolesEditDescription')}</SheetDescription>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-role-name">{t('teamRolesNameLabel')}</Label>
              <Input
                id="edit-role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={locked || save.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role-desc">{t('teamRolesDescriptionLabel')}</Label>
              <Input
                id="edit-role-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={locked || save.isPending}
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t('teamRolesPermissionsLabel')}</legend>
              <PermissionGroupToggles
                lang={lang}
                permissions={permissions}
                onChange={setPermissions}
                enabledModuleIds={me?.modules ?? []}
                disabled={locked || save.isPending}
              />
            </fieldset>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('teamInviteCancel')}
            </Button>
            {locked ? null : (
              <Button
                type="button"
                variant="accent"
                disabled={!name.trim()}
                loading={save.isPending}
                onClick={() => save.mutate()}
              >
                {t('teamRolesSave')}
              </Button>
            )}
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
