import { useMemo, type ReactNode } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { MoreVertical } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { TeamMember } from '@/lib/types/team-types'
import { cn } from '@/lib/utils'
import { Badge } from '@/ui/badge'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

const columnHelper = createColumnHelper<TeamMember>()

export type TeamMemberRowAction = {
  key: string
  label: string
  destructive?: boolean
  onSelect: () => void
}

type TeamMembersTableProps = {
  rows: TeamMember[]
  searchQ: string
  onSearchChange: (value: string) => void
  isLoading: boolean
  isFetching: boolean
  hasEverLoaded: boolean
  actionsBusy: boolean
  getRowActions: (member: TeamMember) => TeamMemberRowAction[]
  footer: ReactNode
  t: (key: ShellStringKey) => string
}

function memberDisplayName(member: TeamMember): string {
  const parts = [member.first_name, member.last_name].filter(Boolean)
  if (parts.length > 0) return parts.join(' ')
  return member.email
}

function memberRowId(member: TeamMember): string {
  return member.invitation_id ?? member.user_id ?? member.email
}

export function TeamMembersTable({
  rows,
  searchQ,
  onSearchChange,
  isLoading,
  isFetching,
  hasEverLoaded,
  actionsBusy,
  getRowActions,
  footer,
  t,
}: TeamMembersTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'member',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('teamColumnMember')} />
        ),
        cell: ({ row }) => {
          const member = row.original
          return (
            <div className="min-w-0 py-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary">
                  {memberDisplayName(member)}
                </span>
                {member.is_you ? (
                  <Badge variant="secondary">{t('teamYouBadge')}</Badge>
                ) : null}
              </div>
              <p className="text-xs text-text-tertiary">{member.email}</p>
            </div>
          )
        },
      }),
      columnHelper.accessor('role_name', {
        id: 'role',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('teamColumnRole')} />
        ),
        cell: ({ getValue }) => (
          <span className="text-text-primary">{getValue()}</span>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('teamColumnStatus')} />
        ),
        cell: ({ getValue }) => {
          const status = getValue()
          return (
            <Badge variant={status === 'pending' ? 'secondary' : 'success'}>
              {status === 'pending' ? t('teamStatusPending') : t('teamStatusActive')}
            </Badge>
          )
        },
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">{t('teamActions')}</span>,
        cell: ({ row }) => {
          const actions = getRowActions(row.original)
          if (actions.length === 0) return null
          return (
            <div className="flex w-full justify-end">
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
                    {actions.map((action) => (
                      <DropdownMenuItem
                        key={action.key}
                        variant={action.destructive ? 'destructive' : 'default'}
                        onClick={action.onSelect}
                      >
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
        meta: { headerClassName: 'w-12', cellClassName: 'w-12' },
      }),
    ],
    [actionsBusy, getRowActions, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: rows,
    columns,
    state: {
      globalFilter: searchQ,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: memberRowId,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? '')
        .trim()
        .toLowerCase()
      if (!q) return true
      const member = row.original
      const hay = `${memberDisplayName(member)} ${member.email} ${member.role_name}`.toLowerCase()
      return hay.includes(q)
    },
    enableSorting: false,
  })

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      isFetching={isFetching}
      hasEverLoaded={hasEverLoaded}
      skeletonRowCount={6}
      search={{
        value: searchQ,
        onChange: onSearchChange,
        placeholder: t('teamFilterPlaceholder'),
        ariaLabel: t('teamFilterPlaceholder'),
        clearAriaLabel: t('filterClear'),
        className: 'max-w-72',
      }}
      emptyContent={
        <p className="px-4 py-8 text-center text-sm text-text-secondary">{t('teamEmpty')}</p>
      }
      footer={
        footer ? (
          <div className="border-t border-border-subtle px-4 py-3 text-sm text-text-tertiary">
            {footer}
          </div>
        ) : null
      }
    />
  )
}
