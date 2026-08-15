import { Check } from 'lucide-react'

import { roleOptionPresentation } from '@/lib/team/role-option-presentation'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { WorkspaceRole } from '@/lib/types/team-types'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/ui/app-icon'

type TeamRoleOptionListProps = {
  roles: WorkspaceRole[]
  selectedRoleId: string
  disabled?: boolean
  onSelect: (roleId: string) => void
  t: (key: ShellStringKey) => string
}

export function TeamRoleOptionList({
  roles,
  selectedRoleId,
  disabled = false,
  onSelect,
  t,
}: TeamRoleOptionListProps) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label={t('teamInviteRoleLabel')}>
      {roles.map((role) => {
        const selected = selectedRoleId === role.id
        const visual = roleOptionPresentation(role)
        const description = visual.descriptionKey
          ? t(visual.descriptionKey)
          : (role.description ?? t('teamRoleCustomDescription'))
        return (
          <button
            key={role.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onSelect(role.id)}
            className={cn(
              'flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition-colors',
              selected
                ? 'border-[var(--firefly-base)] bg-muted/40'
                : 'border-border-subtle hover:bg-muted/20',
            )}
          >
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <AppIcon name={visual.icon} className="size-4" colorize />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-text-primary">{role.name}</span>
              <span className="mt-0.5 block text-xs leading-snug text-text-tertiary">
                {description}
              </span>
            </span>
            {selected ? (
              <Check className="mt-1 size-4 shrink-0 text-text-primary" aria-hidden />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
