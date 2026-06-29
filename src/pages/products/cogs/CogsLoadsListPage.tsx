import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { toast } from 'sonner'

import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { CogsBulkLoadSummaryApi } from '@/lib/types/cogs-load'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { Button } from '@/ui/button'
import { DataTable } from '@/ui/data-table/data-table'

import { CogsPageBreadcrumb } from './cogs-page-breadcrumb'
import { cogsLoadOpenPath, createCogsLoadsColumns } from './cogs-loads-columns'
import {
  useCloneCogsLoadMutation,
  useCogsLoadsQuery,
  useCreateCogsLoadMutation,
  useDeleteCogsLoadMutation,
} from './use-cogs-load-queries'

export function CogsLoadsListPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const t = useCallback((k: ShellStringKey) => shellT(lang, k), [lang])
  const loadsQuery = useCogsLoadsQuery()
  const createMutation = useCreateCogsLoadMutation()
  const deleteMutation = useDeleteCogsLoadMutation()
  const cloneMutation = useCloneCogsLoadMutation()

  const items = loadsQuery.data?.items ?? []

  const onNewLoad = async () => {
    try {
      const load = await createMutation.mutateAsync()
      void navigate(`/dashboard/products/cogs/loads/${load.id}`)
    } catch {
      toast.error(t('productsCogsLoadCreateFailed'))
    }
  }

  const onOpenLoad = useCallback(
    (row: CogsBulkLoadSummaryApi) => {
      const path = cogsLoadOpenPath(row)
      if (path) void navigate(path)
    },
    [navigate],
  )

  const onCloneLoad = useCallback(
    (row: CogsBulkLoadSummaryApi) => {
      void cloneMutation.mutateAsync(row.id).then((cloned) => {
        toast.success(t('productsCogsLoadCloned'))
        void navigate(`/dashboard/products/cogs/loads/${cloned.id}`)
      })
    },
    [cloneMutation, navigate, t],
  )

  const onDeleteLoad = useCallback(
    (row: CogsBulkLoadSummaryApi) => {
      void deleteMutation.mutateAsync(row.id).then(() => {
        toast.success(t('productsCogsLoadDeleted'))
      })
    },
    [deleteMutation, t],
  )

  const columns = useMemo(
    () =>
      createCogsLoadsColumns(t, lang, {
        onOpen: onOpenLoad,
        onClone: onCloneLoad,
        onDelete: onDeleteLoad,
      }),
    [lang, onCloneLoad, onDeleteLoad, onOpenLoad, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <DashboardPage className="flex flex-1 flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <CogsPageBreadcrumb />
          <h1 className={pageTitleClassName}>{t('productsCogsLoadsTitle')}</h1>
          <p className="max-w-2xl text-sm text-text-secondary">{t('productsCogsLoadsSubtitle')}</p>
        </div>
        <Button type="button" loading={createMutation.isPending} onClick={() => void onNewLoad()}>
          {t('productsCogsLoadNew')}
        </Button>
      </header>

      {loadsQuery.isError ? (
        <p className="text-sm text-destructive">{t('productsCogsLoadsLoadError')}</p>
      ) : (
        <DataTable
          table={table}
          isLoading={loadsQuery.isLoading}
          isFetching={loadsQuery.isFetching}
          hasEverLoaded={loadsQuery.data !== undefined}
          emptyContent={t('productsCogsLoadsEmpty')}
          skeletonRowCount={5}
          scrollClassName="overflow-auto"
          onRowClick={onOpenLoad}
        />
      )}
    </DashboardPage>
  )
}
