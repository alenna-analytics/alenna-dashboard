import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'

type ExpensesDeleteDialogProps = {
  lang: string
  open: boolean
  onOpenChange: (open: boolean) => void
  deletePending: boolean
  onConfirmDelete: () => void
}

export function ExpensesDeleteDialog({
  lang,
  open,
  onOpenChange,
  deletePending,
  onConfirmDelete,
}: ExpensesDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{shellT(lang, 'expensesDeleteBtn')}</DialogTitle>
          <DialogDescription>{shellT(lang, 'expensesDeleteConfirm')}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={deletePending}
            onClick={() => onOpenChange(false)}
          >
            {shellT(lang, 'integrationsDialogCancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={deletePending}
            className="gap-2"
            onClick={onConfirmDelete}
          >
            {shellT(lang, 'expensesDeleteBtn')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
