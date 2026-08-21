import type { ReactNode } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { PermissionHierarchyGroup } from '@/lib/permissions/permission-groups'

type Translate = (key: ShellStringKey) => string

type GrantedPermissionTreeProps = {
  groups: PermissionHierarchyGroup[]
  t: Translate
  emptyLabel: string
}

export function GrantedPermissionTree({ groups, t, emptyLabel }: GrantedPermissionTreeProps) {
  const granted = groups.filter((group) => group.granted)
  if (granted.length === 0) {
    return <p className="text-sm text-text-secondary">{emptyLabel}</p>
  }
  return (
    <ul className="space-y-3">
      {granted.map((group) => {
        const actions = group.actions.filter((action) => action.granted)
        return (
          <li key={group.titleKey}>
            <p className="text-sm font-medium text-text-primary">{t(group.titleKey)}</p>
            <ul className="mt-1 space-y-1 border-l border-border-subtle pl-3">
              {actions.map((action) => (
                <li key={action.labelKey} className="text-xs text-text-secondary">
                  {t(action.labelKey)}
                </li>
              ))}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}

type RoleSummaryFieldProps = {
  label: string
  children: ReactNode
}

export function RoleSummaryField({ label, children }: RoleSummaryFieldProps) {
  return (
    <div className="grid gap-2 py-5 first:pt-0 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start sm:gap-x-8">
      <p className="text-sm font-medium text-text-primary">{label}</p>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
