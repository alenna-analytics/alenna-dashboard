import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { getCoreRowModel, getPaginationRowModel, type ColumnDef, type PaginationState, type RowSelectionState, useReactTable } from '@tanstack/react-table'
import { toast } from 'sonner'

import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { listActiveConnections } from '@/pages/integrations/dashboard/integration-connection'
import type {
  CogsPlatformSyncDiffStatus,
  CogsPlatformSyncPreviewItemApi,
  CogsPlatformSyncPreviewResponse,
} from '@/lib/types/cogs-platform-sync'
import {
  GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { Button } from '@/ui/button'
import { Checkbox } from '@/ui/checkbox'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTablePagination } from '@/ui/data-table/data-table-pagination'
import { Label } from '@/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { StatusPill } from '@/ui/status-pill'

import { CogsPageBreadcrumb } from './cogs-page-breadcrumb'
import {
  CogsPlatformSyncPlatformCard,
  type CogsSyncPlatformSlug,
} from './cogs-platform-sync-platform-card'
import { CogsPlatformSyncSummaryCard } from './cogs-platform-sync-summary-card'
import {
  isDefaultSelectedRow,
  useCogsPlatformSyncApplyMutation,
  useCogsPlatformSyncPreviewMutation,
} from './use-cogs-platform-sync-queries'

const PREVIEW_PAGE_SIZE = 50

function diffStatusLabel(t: (k: ShellStringKey) => string, status: CogsPlatformSyncDiffStatus): string {
  switch (status) {
    case 'same':
      return t('productsCogsSyncStatusSame')
    case 'different':
      return t('productsCogsSyncStatusDifferent')
    case 'missing_platform_cost':
      return t('productsCogsSyncStatusMissingPlatformCost')
    case 'currency_mismatch':
      return t('productsCogsSyncStatusCurrencyMismatch')
    case 'missing_current_cost':
      return t('productsCogsSyncStatusMissingCurrentCost')
  }
}

function formatMoney(value: number | null | undefined, currency: string): string {
  if (value == null) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}


export function CogsPlatformSyncPage() {
  const { lang } = useLanguage()
  const t = useCallback((k: ShellStringKey) => shellT(lang, k), [lang])
  const connectionsQuery = usePlatformConnectionsQuery()
  const previewMutation = useCogsPlatformSyncPreviewMutation()
  const applyMutation = useCogsPlatformSyncApplyMutation()
  const { upsertActivity, registerCogsBulkBackfillJobs } = useGlobalActivity()

  const shopifyConnections = useMemo(
    () => listActiveConnections(connectionsQuery.data ?? [], 'shopify'),
    [connectionsQuery.data],
  )

  const [selectedPlatform, setSelectedPlatform] = useState<CogsSyncPlatformSlug>('shopify')
  const [connectionId, setConnectionId] = useState<string>('')
  const [preview, setPreview] = useState<CogsPlatformSyncPreviewResponse | null>(null)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PREVIEW_PAGE_SIZE,
  })
  const [scopeError, setScopeError] = useState(false)

  useEffect(() => {
    if (!connectionId && shopifyConnections.length === 1) {
      setConnectionId(shopifyConnections[0].id)
    }
  }, [connectionId, shopifyConnections])

  const selectedProductIds = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => id),
    [rowSelection],
  )

  const handlePlatformSelect = (platform: CogsSyncPlatformSlug) => {
    if (platform === 'mercadolibre') return
    setSelectedPlatform(platform)
    setPreview(null)
    setRowSelection({})
    setPagination({ pageIndex: 0, pageSize: PREVIEW_PAGE_SIZE })
    setScopeError(false)
  }

  const handlePreview = async () => {
    if (!connectionId) {
      toast.error(t('productsCogsSyncSelectConnection'))
      return
    }
    setScopeError(false)
    try {
      const result = await previewMutation.mutateAsync({
        platform: 'shopify',
        platform_connection_id: connectionId,
      })
      setPreview(result)
      setPagination({ pageIndex: 0, pageSize: PREVIEW_PAGE_SIZE })
      const defaultSelection: RowSelectionState = {}
      for (const row of result.items) {
        if (isDefaultSelectedRow(row)) {
          defaultSelection[row.product_id] = true
        }
      }
      setRowSelection(defaultSelection)
    } catch (error) {
      const message = error instanceof Error ? error.message : t('productsCogsSyncPreviewFailed')
      if (message.includes('shopify_scope_read_inventory_required')) {
        setScopeError(true)
      }
      toast.error(message)
    }
  }

  const handleApply = async () => {
    if (!connectionId || selectedProductIds.length === 0) return
    try {
      const result = await applyMutation.mutateAsync({
        platform: 'shopify',
        platform_connection_id: connectionId,
        product_ids: selectedProductIds,
      })
      if (result.backfill_jobs.length > 0) {
        registerCogsBulkBackfillJobs(result.backfill_jobs.map((job) => job.job_id))
        upsertActivity({
          id: GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID,
          phase: 'loading',
          title: t('globalActivityCogsBackfillTitle'),
          subtitle: t('productsJobQueued'),
          href: '/dashboard/products/cogs/sync',
        })
      }
      toast.success(
        t('productsCogsSyncApplySuccess')
          .replace('{updated}', String(result.updated_count))
          .replace('{skipped}', String(result.skipped_count)),
      )
      if (result.errors.length > 0) {
        toast.error(t('productsCogsSyncApplyPartialErrors').replace('{count}', String(result.errors.length)))
      }
      void handlePreview()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('productsCogsSyncApplyFailed'))
    }
  }

  const previewItems = useMemo(() => preview?.items ?? [], [preview])
  const currency = preview?.base_currency ?? 'USD'

  const selectedCount = selectedProductIds.length
  const totalPreviewItems = previewItems.length
  const showSelectAllBanner =
    selectedCount > 0 && totalPreviewItems > 0 && selectedCount < totalPreviewItems

  const clearSelection = useCallback(() => {
    setRowSelection({})
  }, [])

  const selectAllPreviewRows = useCallback(() => {
    const next: RowSelectionState = {}
    for (const row of previewItems) {
      next[row.product_id] = true
    }
    setRowSelection(next)
  }, [previewItems])

  const columns = useMemo((): ColumnDef<CogsPlatformSyncPreviewItemApi>[] => [
      {
        id: 'select',
        header: ({ table }) => {
          const allSelected = table.getIsAllRowsSelected()
          const someSelected = table.getIsSomeRowsSelected()
          return (
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              onCheckedChange={(value) => table.toggleAllRowsSelected(Boolean(value))}
              aria-label={t('productsCogsSyncSelectAll')}
            />
          )
        },
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label={t('productsCogsSyncSelectRow')}
          />
        ),
        enableSorting: false,
        meta: {
          headerClassName: 'w-10 min-w-10',
          cellClassName: 'w-10 min-w-10',
        },
      },
      {
        accessorKey: 'sku',
        header: t('productsCogsSyncColSku'),
        cell: ({ row }) => (
          <span className="block truncate" title={row.original.sku}>
            {row.original.sku}
          </span>
        ),
        meta: {
          headerClassName: 'min-w-[11rem]',
          cellClassName: 'min-w-[11rem] max-w-[14rem]',
        },
      },
      {
        accessorKey: 'name',
        header: t('productsCogsSyncColName'),
        cell: ({ row }) => (
          <span className="block truncate" title={row.original.name}>
            {row.original.name}
          </span>
        ),
        meta: {
          headerClassName: 'min-w-[14rem]',
          cellClassName: 'min-w-[14rem] max-w-[22rem]',
        },
      },
      {
        id: 'diff_status',
        header: t('productsCogsSyncColStatus'),
        cell: ({ row }) => (
          <StatusPill
            variant={
              row.original.diff_status === 'different'
                ? 'warning'
                : row.original.diff_status === 'same'
                  ? 'success'
                  : 'neutral'
            }
          >
            {diffStatusLabel(t, row.original.diff_status)}
          </StatusPill>
        ),
        meta: {
          headerClassName: 'min-w-[12rem]',
          cellClassName: 'min-w-[12rem] whitespace-nowrap',
        },
      },
      {
        id: 'current_cost',
        header: t('productsCogsSyncColCurrentCost'),
        cell: ({ row }) => formatMoney(row.original.current_cost, currency),
        meta: {
          headerClassName: 'min-w-[8.5rem] [&>div]:justify-end',
          cellClassName: 'min-w-[8.5rem] tabular-nums [&>div]:justify-end',
        },
      },
      {
        id: 'platform_cost',
        header: t('productsCogsSyncColPlatformCost'),
        cell: ({ row }) => formatMoney(row.original.platform_cost, currency),
        meta: {
          headerClassName: 'min-w-[8.5rem] [&>div]:justify-end',
          cellClassName: 'min-w-[8.5rem] tabular-nums [&>div]:justify-end',
        },
      },
    ], [currency, t])

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: previewItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.product_id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: { rowSelection, pagination },
  })

  const shopifyConnectionFooter = useMemo(() => {
    if (connectionsQuery.isLoading) {
      return <p className="text-sm text-text-secondary">{t('productsCogsSyncPreviewLoading')}</p>
    }
    if (shopifyConnections.length === 0) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">{t('productsCogsSyncNoConnection')}</p>
          <Link
            to="/dashboard/integrations/shopify"
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium"
            onClick={(event) => event.stopPropagation()}
          >
            {t('productsCogsSyncConnectShopify')}
          </Link>
        </div>
      )
    }
    if (shopifyConnections.length === 1) {
      return (
        <p className="truncate text-sm text-text-secondary">
          {shopifyConnections[0].shop_domain ?? shopifyConnections[0].id}
        </p>
      )
    }
    return (
      <Select
        value={connectionId}
        onValueChange={(value) => {
          if (value) {
            setConnectionId(value)
            setPreview(null)
            setRowSelection({})
          }
        }}
      >
        <SelectTrigger className="h-8" onClick={(event) => event.stopPropagation()}>
          <SelectValue placeholder={t('productsCogsSyncSelectConnectionPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {shopifyConnections.map((connection) => (
            <SelectItem key={connection.id} value={connection.id}>
              {connection.shop_domain ?? connection.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }, [
    connectionId,
    connectionsQuery.isLoading,
    shopifyConnections,
    t,
  ])

  const showShopifyConnection = selectedPlatform === 'shopify'

  return (
    <DashboardPage className="flex flex-1 flex-col gap-5">
      <header className="space-y-2">
        <CogsPageBreadcrumb />
        <h1 className={pageTitleClassName}>{t('productsCogsSyncTitle')}</h1>
        <p className="max-w-2xl text-sm text-text-secondary">{t('productsCogsSyncSubtitle')}</p>
      </header>

      {scopeError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>{t('productsCogsSyncScopeRequired')}</p>
          <Link
            to="/dashboard/integrations/shopify"
            className="mt-2 inline-block font-medium text-amber-950 underline"
          >
            {t('productsCogsSyncReconnectShopify')}
          </Link>
        </div>
      ) : null}

      <section className="space-y-3">
        <Label>{t('productsCogsSyncPlatformLabel')}</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <CogsPlatformSyncPlatformCard
            lang={lang}
            platform="shopify"
            available
            selected={selectedPlatform === 'shopify'}
            footer={shopifyConnectionFooter}
            onSelect={() => handlePlatformSelect('shopify')}
          />
          <CogsPlatformSyncPlatformCard
            lang={lang}
            platform="mercadolibre"
            available={false}
            selected={selectedPlatform === 'mercadolibre'}
            comingSoon
            onSelect={() => handlePlatformSelect('mercadolibre')}
          />
        </div>
      </section>

      {showShopifyConnection ? (
        <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="accent"
          loading={previewMutation.isPending}
          onClick={() => void handlePreview()}
          disabled={!connectionId}
        >
          {t('productsCogsSyncPreviewAction')}
        </Button>
        {preview && selectedCount > 0 ? (
          <Button
            type="button"
            variant="default"
            loading={applyMutation.isPending}
            onClick={() => void handleApply()}
          >
            {t('productsCogsSyncApplyAction').replace('{count}', String(selectedCount))}
          </Button>
        ) : null}
        </div>
      ) : null}

      {preview ? (
        <div className="space-y-3">
          <CogsPlatformSyncSummaryCard lang={lang} summary={preview.summary} />
          <DataTable
            table={table}
            isLoading={false}
            isFetching={previewMutation.isPending}
            hasEverLoaded
            emptyContent={t('productsCogsSyncPreviewEmpty')}
            scrollClassName="max-h-[calc(100dvh-16rem)] overflow-auto"
            toolbar={
              selectedCount > 0 ? (
                <div className="flex h-8 max-w-full shrink-0 items-center gap-2 rounded-md border border-border-subtle bg-glass-fill-muted px-2.5 text-xs font-medium text-text-primary sm:gap-3 sm:px-3">
                  <span className="whitespace-nowrap tabular-nums">
                    {selectedCount} {t('productsTableSelected')}
                  </span>
                  {showSelectAllBanner ? (
                    <button
                      type="button"
                      className="shrink-0 text-left text-xs font-semibold text-primary underline underline-offset-2 hover:text-primary/85"
                      onClick={selectAllPreviewRows}
                    >
                      {t('productsTableSelectAllWithCount').replace('{count}', String(totalPreviewItems))}
                    </button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-7 shrink-0 rounded-md text-text-secondary hover:text-text-primary"
                    aria-label={t('productsTableClearSelection')}
                    onClick={clearSelection}
                  >
                    <X className="size-3.5 shrink-0" aria-hidden />
                  </Button>
                </div>
              ) : null
            }
            footer={
              <DataTablePagination
                table={table}
                labels={{
                  ariaPrevious: t('productsTablePrev'),
                  ariaNext: t('productsTableNext'),
                  pageStatus: (page, totalPages) =>
                    `${t('productsTablePageLabel')} ${page} ${t('productsTableOf')} ${totalPages}`,
                  pageButtonAria: (page, totalPages) =>
                    `${t('productsTablePageLabel')} ${page} ${t('productsTableOf')} ${totalPages}`,
                  goToPageLabel: t('productsTableGoToPage'),
                  goToPageAria: t('productsTableGoToPageAria'),
                }}
              />
            }
          />
        </div>
      ) : null}
    </DashboardPage>
  )
}
