import type { ComponentProps } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertCircle, Copy, Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { CogsBulkLoadStatus, CogsBulkLoadSummaryApi } from '@/lib/types/cogs-load'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { StatusPill } from '@/ui/status-pill'

export type CogsLoadsColumnActions = {
  onOpen: (row: CogsBulkLoadSummaryApi) => void
  onClone: (row: CogsBulkLoadSummaryApi) => void
  onDelete: (row: CogsBulkLoadSummaryApi) => void
}

function statusLabel(status: CogsBulkLoadStatus, t: (key: ShellStringKey) => string): string {
  switch (status) {
    case 'draft':
      return t('productsCogsLoadStatusDraft')
    case 'applying':
      return t('productsCogsLoadStatusApplying')
    case 'applied':
      return t('productsCogsLoadStatusApplied')
    case 'apply_failed':
      return t('productsCogsLoadStatusApplyFailed')
  }
}

function statusPillVariant(status: CogsBulkLoadStatus): ComponentProps<typeof StatusPill>['variant'] {
  switch (status) {
    case 'draft':
      return 'warning'
    case 'applying':
      return 'info'
    case 'applied':
      return 'success'
    case 'apply_failed':
      return 'error'
  }
}

function openActionLabel(status: CogsBulkLoadStatus, t: (key: ShellStringKey) => string): string {
  if (status === 'draft') return t('productsCogsLoadContinue')
  if (status === 'applied') return t('productsCogsLoadView')
  if (status === 'apply_failed') return t('productsCogsLoadViewError')
  return t('productsCogsLoadView')
}

function openActionIcon(status: CogsBulkLoadStatus) {
  if (status === 'draft') return Pencil
  if (status === 'apply_failed') return AlertCircle
  return Eye
}

export function createCogsLoadsColumns(
  t: (key: ShellStringKey) => string,
  lang: string,
  actions: CogsLoadsColumnActions,
): ColumnDef<CogsBulkLoadSummaryApi>[] {
  const formatWhen = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString(lang === 'es' ? 'es-MX' : 'en-US')
  }

  return [
    {
      accessorKey: 'status',
      header: t('productsCogsLoadColStatus'),
      cell: ({ row }) => (
        <StatusPill variant={statusPillVariant(row.original.status)}>
          {statusLabel(row.original.status, t)}
        </StatusPill>
      ),
    },
    {
      accessorKey: 'product_count',
      header: t('productsCogsLoadColProducts'),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.product_count}</span>
      ),
    },
    {
      accessorKey: 'created_by_name',
      header: t('productsCogsLoadColCreatedBy'),
      cell: ({ row }) => row.original.created_by_name ?? '—',
    },
    {
      accessorKey: 'created_at',
      header: t('productsCogsLoadColCreatedAt'),
      cell: ({ row }) => formatWhen(row.original.created_at),
    },
    {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      header: () => <span className="sr-only">{t('productsCogsLoadColActions')}</span>,
      cell: ({ row }) => {
        const load = row.original
        const OpenIcon = openActionIcon(load.status)
        return (
          <div
            className="flex justify-end"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-full border border-transparent text-foreground outline-none',
                  'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30',
                )}
                aria-label={t('productsCogsLoadColActions')}
              >
                <MoreVertical className="size-4 shrink-0" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t('productsCogsLoadColActions')}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {load.status !== 'applying' ? (
                    <DropdownMenuItem onClick={() => actions.onOpen(load)}>
                      <OpenIcon className="size-4 shrink-0" aria-hidden />
                      {openActionLabel(load.status, t)}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={() => actions.onClone(load)}>
                    <Copy className="size-4 shrink-0" aria-hidden />
                    {t('productsCogsLoadClone')}
                  </DropdownMenuItem>
                  {load.status === 'draft' ? (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => actions.onDelete(load)}
                    >
                      <Trash2 className="size-4 shrink-0" aria-hidden />
                      {t('productsCogsLoadDelete')}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      meta: { cellClassName: 'w-12 text-right' },
    },
  ]
}

export function cogsLoadOpenPath(row: CogsBulkLoadSummaryApi): string | null {
  if (row.status === 'applying') return null
  if (row.status === 'applied') return `/dashboard/products/cogs/loads/${row.id}/view`
  return `/dashboard/products/cogs/loads/${row.id}`
}
