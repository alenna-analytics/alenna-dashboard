import { Pencil } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import { SegmentedInputSubmit } from '@/ui/segmented-input-submit'
import { cn } from '@/lib/utils'

const NUM = 'font-numeric tabular-nums'

type ProductDetailSkuRowProps = {
  internalSku: string | null
  t: (key: ShellStringKey) => string
  editing: boolean
  draft: string
  onDraftChange: (value: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  savePending: boolean
}

export function ProductDetailSkuRow({
  internalSku,
  t,
  editing,
  draft,
  onDraftChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  savePending,
}: ProductDetailSkuRowProps) {
  if (editing) {
    return (
      <SegmentedInputSubmit
        value={draft}
        onValueChange={onDraftChange}
        placeholder={t('productsDetailSkuPlaceholder')}
        submitLabel={t('productsDetailSkuSave')}
        onSubmit={onSave}
        submitDisabled={false}
        submitPending={savePending}
        onClose={onCancelEdit}
        closeAriaLabel={t('productsDetailSkuCloseEditAria')}
        ariaLabel={t('productsDetailEditSkuAria')}
        inputClassName="font-mono text-xs"
      />
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-1">
      <span className={cn(NUM)}>
        {internalSku?.trim()
          ? t('productsDetailHeaderMetaSku').replace('{sku}', internalSku)
          : t('productsDetailHeaderMetaSkuUnset')}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-7"
        aria-label={t('productsDetailEditSkuAria')}
        onClick={onStartEdit}
      >
        <Pencil className="size-3.5" />
      </Button>
    </div>
  )
}
