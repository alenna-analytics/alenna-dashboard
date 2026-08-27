import { useCallback, useMemo, type ReactNode } from 'react'
import { getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { useMoney } from '@/hooks/use-money'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import type { CogsBulkLoadSummaryApi } from '@/lib/types/cogs-load'
import { cn } from '@/lib/utils'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { DataTable } from '@/ui/data-table/data-table'
import { TableEmptyCell } from '@/ui/data-table/table-empty-cell'
import { EmptyState } from '@/ui/empty-state'
import { StatusPill } from '@/ui/status-pill'

import { createCogsLoadDetailColumns } from './cogs-load-detail-columns'
import { CogsLoadDetailLoadingSkeleton } from './cogs-load-editor-loading-skeleton'
import {
  cogsLoadStatusLabel,
  cogsLoadStatusPillVariant,
} from './cogs-loads-columns'
import { useCloneCogsLoadMutation, useCogsLoadQuery } from './use-cogs-load-queries'

type StatColumnProps = {
  label: string
  children: ReactNode
  valueClassName?: string
}

function StatColumn({ label, children, valueClassName }: StatColumnProps) {
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <span className="whitespace-nowrap text-xs text-text-tertiary">{label}</span>
      <div
        className={cn(
          'flex min-h-8 items-center text-sm font-normal text-text-primary',
          valueClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}

type CogsLoadDetailStatsProps = {
  load: CogsBulkLoadSummaryApi
  productCount: number
  appliedLabel: string
  t: (key: ShellStringKey) => string
}

type CogsLoadDetailStatColumn = {
  key: string
  label: string
  value: ReactNode
  valueClassName?: string
}

function CogsLoadDetailStats({
  load,
  productCount,
  appliedLabel,
  t,
}: CogsLoadDetailStatsProps) {
  const columns: CogsLoadDetailStatColumn[] = [
    {
      key: 'status',
      label: t('productsCogsLoadColStatus'),
      value: (
        <StatusPill variant={cogsLoadStatusPillVariant(load.status)}>
          {cogsLoadStatusLabel(load.status, t)}
        </StatusPill>
      ),
    },
    {
      key: 'appliedBy',
      label: t('productsCogsLoadAppliedBy'),
      value: load.applied_by_name ?? <TableEmptyCell />,
    },
    {
      key: 'appliedAt',
      label: t('productsCogsLoadAppliedAt'),
      value: appliedLabel,
    },
    {
      key: 'products',
      label: t('productsCogsLoadColProducts'),
      value: productCount,
      valueClassName: 'tabular-nums',
    },
  ]

  return (
    <div className="grid w-full grid-cols-2 gap-x-4 gap-y-4 sm:inline-flex sm:max-w-full sm:flex-wrap sm:items-stretch">
      {columns.map((col, index) => (
        <div
          key={col.key}
          className={cn(
            'flex shrink-0',
            index > 0 && 'sm:border-l sm:border-border-subtle sm:pl-6',
            index < columns.length - 1 && 'sm:pr-5',
          )}
        >
          <StatColumn label={col.label} valueClassName={col.valueClassName}>
            {col.value}
          </StatColumn>
        </div>
      ))}
    </div>
  )
}

export function CogsLoadDetailPage() {
  const { loadId } = useParams<{ loadId: string }>()
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const { format: formatMoney } = useMoney()
  const canEditProducts = can(me, 'products.edit')
  const t = useCallback((k: ShellStringKey) => shellT(lang, k), [lang])
  const loadQuery = useCogsLoadQuery(loadId)
  const cloneMutation = useCloneCogsLoadMutation()

  const detail = loadQuery.data
  const items = detail?.items ?? []
  const baseCurrency = detail?.base_currency ?? 'MXN'

  const formatCost = useCallback(
    (value: number) =>
      formatMoney(value, {
        nativeCurrency: baseCurrency,
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
    [baseCurrency, formatMoney],
  )

  const columns = useMemo(
    () => createCogsLoadDetailColumns({ t, formatCost }),
    [formatCost, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  })

  if (!loadId || loadQuery.isLoading) {
    return (
      <DashboardPage className="flex flex-1 flex-col gap-6">
        <CogsLoadDetailLoadingSkeleton />
      </DashboardPage>
    )
  }

  if (loadQuery.isError || !detail) {
    return (
      <DashboardPage>
        <p className="text-sm text-destructive">{t('productsCogsLoadsLoadError')}</p>
      </DashboardPage>
    )
  }

  const appliedLabel = detail.load.applied_at
    ? new Date(detail.load.applied_at).toLocaleString(lang === 'es' ? 'es-MX' : 'en-US')
    : '—'

  return (
    <DashboardPage className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className={pageTitleClassName}>{t('productsCogsLoadViewTitle')}</h1>
          {canEditProducts ? (
            <Button
              type="button"
              variant="accent"
              size="tiny"
              className="shrink-0"
              loading={cloneMutation.isPending}
              onClick={() => {
                void cloneMutation.mutateAsync(loadId).then((cloned) => {
                  toast.success(t('productsCogsLoadCloned'))
                  void navigate(`/dashboard/products/cogs/loads/${cloned.id}`)
                })
              }}
            >
              {t('productsCogsLoadClone')}
            </Button>
          ) : null}
        </div>
        <CogsLoadDetailStats
          load={detail.load}
          productCount={detail.load.applied_product_count ?? detail.items.length}
          appliedLabel={appliedLabel}
          t={t}
        />
      </header>

      <DataTable
        table={table}
        isLoading={false}
        isFetching={false}
        hasEverLoaded
        emptyContent={
          <EmptyState icon="products" title={t('productsCogsLoadDetailEmpty')} />
        }
        scrollClassName="overflow-auto"
      />
    </DashboardPage>
  )
}
