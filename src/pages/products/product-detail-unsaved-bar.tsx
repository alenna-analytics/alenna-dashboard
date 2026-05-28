import { Info, Loader2 } from 'lucide-react'

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
        'sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3',
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
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="default"
          className="border-border-default bg-[var(--platinum-blonde-300)] hover:bg-[var(--platinum-blonde-200)]"
          onClick={onDiscard}
          disabled={savePending}
        >
          {t('productsDetailSkuDiscard')}
        </Button>
        <Button type="button" variant="default" size="default" onClick={onSave} disabled={savePending}>
          {savePending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t('productsDetailSkuSaving')}
            </>
          ) : (
            t('productsDetailSheetSave')
          )}
        </Button>
      </div>
    </div>
  )
}
