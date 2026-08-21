import {
  PERMISSION_DESC_KEYS,
  PERMISSION_LABEL_KEYS,
} from '@/lib/permissions/permission-labels'
import {
  PERMISSION_GROUPS,
  visiblePermissionGroups,
  toggleGroupAction,
  toggleGroupView,
} from '@/lib/permissions/permission-groups'
import { shellT } from '@/lib/i18n/shell-strings'
import type { Language } from '@/shell/providers/language-provider'
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
    <div className="divide-y divide-border-subtle">
      {groups.flatMap((group) => {
        const viewOn = permissions.includes(group.viewKey)
        const rows = [
          <PrivilegeRow
            key={group.viewKey}
            label={t(group.titleKey)}
            description={t(PERMISSION_DESC_KEYS[group.viewKey])}
            checked={viewOn}
            disabled={locked}
            onCheckedChange={(checked) => onChange(toggleGroupView(permissions, group, checked))}
          />,
        ]
        for (const key of group.actionKeys) {
          rows.push(
            <PrivilegeRow
              key={key}
              nested
              muted={!viewOn}
              label={t(PERMISSION_LABEL_KEYS[key])}
              description={t(PERMISSION_DESC_KEYS[key])}
              checked={permissions.includes(key)}
              disabled={locked || !viewOn}
              onCheckedChange={(checked) =>
                onChange(toggleGroupAction(permissions, group, key, checked))
              }
            />,
          )
        }
        return rows
      })}
    </div>
  )
}

function PrivilegeRow({
  label,
  description,
  checked,
  disabled,
  nested = false,
  muted = false,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  disabled: boolean
  nested?: boolean
  muted?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 py-3',
        nested && 'pl-4',
        muted && 'opacity-50',
      )}
    >
      <div className="min-w-0">
        <p className="text-sm text-text-primary">{label}</p>
        <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>
      </div>
      <Switch
        className="mt-0.5"
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
        aria-label={label}
      />
    </div>
  )
}
