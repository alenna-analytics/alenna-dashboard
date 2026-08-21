import { roleOptionPresentation } from '@/lib/team/role-option-presentation'
import type { ShellStringKey, ShellStringVars } from '@/lib/i18n/shell-strings'
import type { WorkspaceRole } from '@/lib/types/team-types'
import { cn } from '@/lib/utils'

type TeamRoleOptionListProps = {
  roles: WorkspaceRole[]
  selectedRoleId: string
  disabled?: boolean
  onSelect: (roleId: string) => void
  t: (key: ShellStringKey, vars?: ShellStringVars) => string
}

export function TeamRoleOptionList({
  roles,
  selectedRoleId,
  disabled = false,
  onSelect,
  t,
}: TeamRoleOptionListProps) {
  return (
    <div
      className="overflow-hidden rounded-md border border-border-default"
      role="radiogroup"
      aria-label={t('teamInviteRoleLabel')}
    >
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
              'flex w-full items-start gap-3 border-b border-border-subtle px-3 py-3 text-left last:border-b-0',
              selected ? 'bg-muted/40' : 'hover:bg-muted/20',
              disabled && 'opacity-50',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                selected ? 'border-text-primary' : 'border-border-default',
              )}
              aria-hidden
            >
              {selected ? <span className="size-2 rounded-full bg-text-primary" /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-text-primary">{role.name}</span>
              <span className="mt-0.5 block text-xs leading-snug text-text-tertiary">
                {description}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
