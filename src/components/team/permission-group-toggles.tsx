import {
  PERMISSION_DESC_KEYS,
  PERMISSION_LABEL_KEYS,
} from '@/lib/permissions/permission-labels'
import {
  PERMISSION_GROUPS,
  visiblePermissionGroups,
  toggleGroupAction,
  toggleGroupView,
  type PermissionGroup,
} from '@/lib/permissions/permission-groups'
import { shellT } from '@/lib/i18n/shell-strings'
import type { Language } from '@/shell/providers/language-provider'
import { Checkbox } from '@/ui/checkbox'
import { Switch } from '@/ui/switch'
import { cn } from '@/lib/utils'

type PermissionGroupTogglesProps = {
  lang: Language
  permissions: string[]
  onChange: (next: string[]) => void
  enabledModuleIds?: readonly string[]
  disabled?: boolean
  preview?: boolean
}

export function PermissionGroupToggles({
  lang,
  permissions,
  onChange,
  enabledModuleIds,
  disabled = false,
  preview = false,
}: PermissionGroupTogglesProps) {
  const t = (key: Parameters<typeof shellT>[1]) => shellT(lang, key)
  const locked = disabled || preview
  const groups =
    enabledModuleIds == null ? PERMISSION_GROUPS : visiblePermissionGroups(enabledModuleIds)

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <PermissionGroupCard
          key={group.id}
          group={group}
          t={t}
          permissions={permissions}
          onChange={onChange}
          locked={locked}
        />
      ))}
    </div>
  )
}

function PermissionGroupCard({
  group,
  t,
  permissions,
  onChange,
  locked,
}: {
  group: PermissionGroup
  t: (key: Parameters<typeof shellT>[1]) => string
  permissions: string[]
  onChange: (next: string[]) => void
  locked: boolean
}) {
  const viewOn = permissions.includes(group.viewKey)
  return (
    <div className="rounded-md border border-border-subtle p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{t(group.titleKey)}</p>
          <p className="mt-0.5 text-xs text-text-tertiary">
            {t(PERMISSION_DESC_KEYS[group.viewKey])}
          </p>
        </div>
        <Switch
          checked={viewOn}
          disabled={locked}
          onCheckedChange={(checked) =>
            onChange(toggleGroupView(permissions, group, Boolean(checked)))
          }
          aria-label={t(group.titleKey)}
        />
      </div>
      {group.actionKeys.length > 0 ? (
        <fieldset className={cn('mt-3 space-y-3', !viewOn && 'opacity-50')}>
          {group.actionKeys.map((key) => (
            <label key={key} className="flex items-start gap-2 text-sm">
              <Checkbox
                className="mt-0.5"
                checked={permissions.includes(key)}
                disabled={locked || !viewOn}
                onCheckedChange={(checked) =>
                  onChange(toggleGroupAction(permissions, group, key, Boolean(checked)))
                }
              />
              <span className="min-w-0">
                <span className="block text-text-primary">{t(PERMISSION_LABEL_KEYS[key])}</span>
                <span className="mt-0.5 block text-xs font-normal text-text-tertiary">
                  {t(PERMISSION_DESC_KEYS[key])}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}
    </div>
  )
}
