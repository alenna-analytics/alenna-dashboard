import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'

type VinculacionDissolveConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  onConfirm: () => void
  t: (key: ShellStringKey) => string
}

export function VinculacionDissolveConfirmDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
  t,
}: VinculacionDissolveConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('productsVinculacionDissolveConfirmTitle')}</DialogTitle>
          <DialogDescription>{t('productsVinculacionDissolveConfirmDescription')}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {t('productsVinculacionConfirmCancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={pending}
            className="gap-2"
            onClick={onConfirm}
          >
            {t('productsVinculacionDissolve')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
