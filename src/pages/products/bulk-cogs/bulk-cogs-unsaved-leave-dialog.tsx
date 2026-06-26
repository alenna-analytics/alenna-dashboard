import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'

type BulkCogsUnsavedLeaveDialogProps = {
  lang: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmLeave: () => void
}

export function BulkCogsUnsavedLeaveDialog({
  lang,
  open,
  onOpenChange,
  onConfirmLeave,
}: BulkCogsUnsavedLeaveDialogProps) {
  const t = (key: ShellStringKey) => shellT(lang, key)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('productsBulkCogsUnsavedLeaveTitle')}</DialogTitle>
          <DialogDescription>{t('productsBulkCogsUnsavedLeaveBody')}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('productsBulkCogsUnsavedLeaveStay')}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirmLeave}>
            {t('productsBulkCogsUnsavedLeaveDiscard')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
