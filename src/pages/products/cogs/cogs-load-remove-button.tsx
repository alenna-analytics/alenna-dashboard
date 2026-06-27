import { Trash2 } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'

type CogsLoadRemoveItemButtonProps = {
  t: (key: ShellStringKey) => string
  disabled?: boolean
  onClick: () => void
}

export function CogsLoadRemoveItemButton({ t, disabled, onClick }: CogsLoadRemoveItemButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
      disabled={disabled}
      aria-label={t('productsCogsLoadRemove')}
      onClick={onClick}
    >
      <Trash2 className="size-4 shrink-0" aria-hidden />
    </Button>
  )
}
