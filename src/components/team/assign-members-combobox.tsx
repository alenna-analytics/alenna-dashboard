import { useMemo, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

import { memberDisplayName } from '@/lib/team/member-display-name'
import type { TeamMember } from '@/lib/types/team-types'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'

type AssignMembersComboboxProps = {
  candidates: TeamMember[]
  selectedIds: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  placeholder: string
  searchPlaceholder: string
  emptySearchLabel: string
  removeLabel: string
  currentRoleLabel: (role: string) => string
}

function memberId(member: TeamMember): string | null {
  return member.user_id
}

export function AssignMembersCombobox({
  candidates,
  selectedIds,
  onChange,
  disabled = false,
  placeholder,
  searchPlaceholder,
  emptySearchLabel,
  removeLabel,
  currentRoleLabel,
}: AssignMembersComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(
    () =>
      candidates.filter((member) => {
        const id = memberId(member)
        return id != null && selectedIds.includes(id)
      }),
    [candidates, selectedIds],
  )
  const remaining = useMemo(
    () =>
      candidates.filter((member) => {
        const id = memberId(member)
        return id != null && !selectedIds.includes(id)
      }),
    [candidates, selectedIds],
  )

  function addMember(id: string) {
    if (selectedIds.includes(id)) return
    const next = [...selectedIds, id]
    onChange(next)
    const stillRemaining = remaining.some((member) => memberId(member) !== id)
    if (!stillRemaining) setOpen(false)
  }

  function removeMember(id: string) {
    onChange(selectedIds.filter((item) => item !== id))
  }

  return (
    <div className="space-y-3">
      {remaining.length > 0 ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            type="button"
            disabled={disabled}
            aria-expanded={open}
            className={cn(
              'flex h-[33px] w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border-default bg-white px-2 text-sm outline-none',
              'hover:border-[color:rgba(var(--ink-rgb),0.36)] focus-visible:ring-3 focus-visible:ring-ring/45',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <span className="min-w-0 truncate text-left text-muted-foreground">{placeholder}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            positionMethod="fixed"
            collisionPadding={12}
            className="w-[min(calc(100vw-48px),22rem)] border-border-subtle bg-white p-0 shadow-[var(--shadow-popover)] ring-1 ring-[color:var(--ring-popover)] backdrop-blur-none"
          >
            <Command className="bg-white">
              <CommandInput placeholder={searchPlaceholder} className="bg-white" />
              <CommandList className="max-h-72 overflow-y-auto bg-white">
                <CommandEmpty>
                  <span className="block px-3 py-6 text-center text-sm text-text-secondary">
                    {emptySearchLabel}
                  </span>
                </CommandEmpty>
                <CommandGroup>
                  {remaining.map((member) => {
                    const id = memberId(member)!
                    return (
                      <CommandItem
                        key={id}
                        value={`${memberDisplayName(member)} ${member.email} ${member.role_name}`}
                        onSelect={() => addMember(id)}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-text-primary">
                            {memberDisplayName(member)}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-text-tertiary">
                            {member.email} · {member.role_name}
                          </span>
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : null}

      {selected.length > 0 ? (
        <ul className="space-y-2">
          {selected.map((member) => {
            const id = memberId(member)!
            return (
              <li
                key={id}
                className="flex items-start justify-between gap-2 rounded-md border border-border-subtle px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-text-primary">
                    {memberDisplayName(member)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-text-tertiary">
                    {member.email} · {currentRoleLabel(member.role_name)}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  aria-label={removeLabel}
                  onClick={() => removeMember(id)}
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
