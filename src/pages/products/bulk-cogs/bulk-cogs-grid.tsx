import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { Input } from '@/ui/input'
import { cn } from '@/lib/utils'

import { computeDraftTotal } from './bulk-cogs-validation'
import type { BulkCogsDraftStore } from './bulk-cogs-draft-store'

const ROW_HEIGHT = 44

type BulkCogsGridProps = {
  rowIds: string[]
  draftStore: BulkCogsDraftStore
  onPatchDraft: (productId: string, field: 'supplierDraft' | 'freightDraft' | 'packagingDraft', value: string) => void
  t: (key: ShellStringKey) => string
}

export function BulkCogsGrid({ rowIds, draftStore, onPatchDraft, t }: BulkCogsGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual returns unstable function refs by design
  const virtualizer = useVirtualizer({
    count: rowIds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  })

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border-subtle">
      <div className="grid shrink-0 grid-cols-[minmax(120px,1.2fr)_minmax(80px,0.9fr)_minmax(70px,0.7fr)_minmax(70px,0.7fr)_minmax(72px,0.75fr)_minmax(72px,0.75fr)_minmax(72px,0.75fr)_minmax(72px,0.75fr)] gap-2 border-b border-border-subtle bg-muted/30 px-3 py-2 text-xs font-medium text-text-secondary">
        <span>{t('productsBulkCogsColProduct')}</span>
        <span>{t('productsBulkCogsColVariant')}</span>
        <span>{t('productsColSku')}</span>
        <span>{t('productsBulkCogsColCurrent')}</span>
        <span>{t('productsBulkCogsColSupplier')}</span>
        <span>{t('productsCostEditorFreight')}</span>
        <span>{t('productsBulkCogsColShipping')}</span>
        <span>{t('productsCostEditorTotal')}</span>
      </div>
      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        <div
          style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const productId = rowIds[virtualRow.index]
            const draft = draftStore.get(productId)
            if (!draft) return null
            const total = computeDraftTotal(draft)
            return (
              <div
                key={productId}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={cn(
                  'grid grid-cols-[minmax(120px,1.2fr)_minmax(80px,0.9fr)_minmax(70px,0.7fr)_minmax(70px,0.7fr)_minmax(72px,0.75fr)_minmax(72px,0.75fr)_minmax(72px,0.75fr)_minmax(72px,0.75fr)] items-center gap-2 border-b border-border-subtle px-3 text-sm',
                  draft.dirty && !draft.invalid && 'bg-primary/5',
                  draft.invalid && draft.dirty && 'bg-destructive/5',
                )}
              >
                <span className="truncate font-medium text-text-primary" title={draft.parentTitle}>
                  {draft.parentTitle}
                </span>
                <span className="truncate text-text-secondary" title={draft.variantLabel ?? undefined}>
                  {draft.variantLabel ?? '—'}
                </span>
                <span className="truncate text-xs text-text-secondary">{draft.internalSku ?? '—'}</span>
                <span className="text-text-secondary">
                  {draft.serverTotal != null ? draft.serverTotal.toFixed(4) : '—'}
                </span>
                <Input
                  value={draft.supplierDraft}
                  onChange={(e) => onPatchDraft(productId, 'supplierDraft', e.target.value)}
                  className="h-8"
                  inputMode="decimal"
                />
                <Input
                  value={draft.freightDraft}
                  onChange={(e) => onPatchDraft(productId, 'freightDraft', e.target.value)}
                  className="h-8"
                  inputMode="decimal"
                />
                <Input
                  value={draft.packagingDraft}
                  onChange={(e) => onPatchDraft(productId, 'packagingDraft', e.target.value)}
                  className="h-8"
                  inputMode="decimal"
                />
                <span className="text-text-secondary">
                  {total != null ? total.toFixed(4) : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
