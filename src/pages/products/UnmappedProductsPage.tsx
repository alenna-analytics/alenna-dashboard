import { useMemo, useState } from 'react'

import { useLanguage } from '@/components/providers/language-provider'
import { useCurrency } from '@/components/providers/currency-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCatalogAssign, useCatalogUnmapped, useProductCatalog } from '@/hooks/use-analytics'
import { useCurrentTenant } from '@/auth/hooks'
import { PLATFORM_LABELS, type DashboardSalesChannel, dashboardT } from '@/lib/dashboard-strings'
import type { CatalogAssignBody, UnmappedGroup } from '@/lib/analytics-types'

function monthStartIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_SKU_KEY = '__EMPTY__'

export function UnmappedProductsPage() {
  const { lang } = useLanguage()
  const t = (key: Parameters<typeof dashboardT>[1]) => dashboardT(lang, key)
  const { formatCurrencyValue, displayCurrency } = useCurrency()
  const { role } = useCurrentTenant()
  const canAssign = role === 'admin' || role === 'owner'

  const [startDate, setStartDate] = useState(monthStartIso)
  const [endDate, setEndDate] = useState(todayIso)
  const [page, setPage] = useState(1)
  const pageSize = 25

  const unmapped = useCatalogUnmapped({
    start_date: startDate,
    end_date: endDate,
    page,
    page_size: pageSize,
  })

  const catalog = useProductCatalog(500)
  const assign = useCatalogAssign()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [group, setGroup] = useState<UnmappedGroup | null>(null)
  const [productId, setProductId] = useState('')
  const [platformSku, setPlatformSku] = useState('')
  const [productQuery, setProductQuery] = useState('')

  const filteredProducts = useMemo(() => {
    const items = catalog.data?.items ?? []
    const q = productQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        (it.internal_sku?.toLowerCase().includes(q) ?? false),
    )
  }, [catalog.data?.items, productQuery])

  const openAssign = (row: UnmappedGroup) => {
    setGroup(row)
    setProductId('')
    setProductQuery('')
    if (row.sku_key === EMPTY_SKU_KEY) {
      setPlatformSku('')
    } else {
      setPlatformSku(row.sku_key)
    }
    setDialogOpen(true)
  }

  const submitAssign = async () => {
    if (!group || !productId.trim() || !platformSku.trim()) return
    const body: CatalogAssignBody = {
      product_id: productId.trim(),
      platform: group.platform,
      platform_sku: platformSku.trim(),
    }
    if (group.sku_key === EMPTY_SKU_KEY) {
      body.line_item_ids = group.line_item_ids
    } else {
      body.line_title = group.line_title
    }
    await assign.mutateAsync(body)
    setDialogOpen(false)
    setGroup(null)
  }

  const rows = unmapped.data?.items ?? []
  const total = unmapped.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <>
      <Card variant="solid">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-sm">{t('unmappedTitle')}</CardTitle>
            <p className="mt-1 text-sm text-text-secondary">{t('unmappedDesc')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(1)
              }}
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!canAssign && (
            <p className="mb-4 text-sm text-text-secondary">{t('catalogAdminOnly')}</p>
          )}
          {unmapped.isLoading ? (
            <p className="text-sm text-text-secondary">{t('catalogDetailLoading')}</p>
          ) : unmapped.isError ? (
            <p className="text-sm text-destructive">{String(unmapped.error)}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-text-secondary">{t('unmappedEmpty')}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('unmappedColPlatform')}</TableHead>
                    <TableHead>{t('unmappedColSku')}</TableHead>
                    <TableHead>{t('unmappedColTitle')}</TableHead>
                    <TableHead className="text-right">{t('unmappedColRevenue')}</TableHead>
                    <TableHead className="text-right">{t('unmappedColLines')}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={`${row.platform}-${row.sku_key}-${row.line_title}-${idx}`}>
                      <TableCell>
                        {PLATFORM_LABELS[row.platform as DashboardSalesChannel] ?? row.platform}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate font-mono text-xs">
                        {row.sku_key === EMPTY_SKU_KEY ? '—' : row.sku_key}
                      </TableCell>
                      <TableCell className="max-w-[280px] text-text-secondary">{row.line_title}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrencyValue(row.total_revenue)} {displayCurrency}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.line_count}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={!canAssign}
                          onClick={() => openAssign(row)}
                        >
                          {t('unmappedAssign')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
                <span>
                  {t('tablePage')} {page} / {totalPages} · {total} {t('tableRows')}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    {t('tablePrev')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t('tableNext')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('catalogAssignDialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-assign-search">{t('catalogAssignPickProduct')}</Label>
              <Input
                id="cat-assign-search"
                placeholder={t('catalogSearchPlaceholder')}
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
              />
              <select
                id="cat-assign-product"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">{t('catalogSelectPlaceholder')}</option>
                {filteredProducts.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.title}
                    {p.internal_sku ? ` (${p.internal_sku})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-assign-sku">{t('catalogAssignPlatformSkuLabel')}</Label>
              <Input
                id="cat-assign-sku"
                value={platformSku}
                onChange={(e) => setPlatformSku(e.target.value)}
                placeholder={t('catalogAssignPlatformSkuLabel')}
              />
              {group?.sku_key === EMPTY_SKU_KEY && (
                <p className="text-xs text-text-secondary">{t('catalogEmptySkuNote')}</p>
              )}
            </div>
          </div>
          <DialogFooter showCloseButton={false}>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t('catalogDialogClose')}
            </Button>
            <Button
              type="button"
              disabled={assign.isPending || !productId || !platformSku.trim()}
              onClick={() => void submitAssign()}
            >
              {t('catalogAssignConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
