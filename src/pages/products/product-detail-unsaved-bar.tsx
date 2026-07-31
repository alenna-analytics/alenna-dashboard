import { Info } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import { cn } from '@/lib/utils'

type ProductDetailUnsavedBarProps = {
  open: boolean
  t: (key: ShellStringKey) => string
  onDiscard: () => void
  onSave: () => void
  savePending: boolean
}

export function ProductDetailUnsavedBar({
  open,
  t,
  onDiscard,
  onSave,
  savePending,
}: ProductDetailUnsavedBarProps) {
  if (!open) return null

  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 flex flex-col gap-3 sm:bottom-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
        'rounded-md border border-[color-mix(in_srgb,var(--firefly-base)_12%,transparent)]',
        'bg-[var(--zara-base)] px-4 py-3 shadow-[0_4px_20px_rgba(11,37,40,0.1)]',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-[var(--firefly-base)]">
        <Info className="size-4 shrink-0 text-[var(--firefly-base)]" aria-hidden />
        <span>{t('productsDetailSkuUnsavedChanges')}</span>
      </div>
      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="default"
          className="min-w-0 flex-1 border-border-default bg-[var(--platinum-blonde-300)] hover:bg-[var(--platinum-blonde-200)] sm:flex-none"
          onClick={onDiscard}
          disabled={savePending}
        >
          {t('productsDetailSkuDiscard')}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="default"
          className="min-w-0 flex-1 sm:flex-none"
          loading={savePending}
          onClick={onSave}
        >
          {savePending ? t('productsDetailSkuSaving') : t('productsDetailSheetSave')}
        </Button>
      </div>
    </div>
  )
}
