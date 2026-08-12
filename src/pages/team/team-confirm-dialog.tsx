import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'

export type TeamConfirmKind = 'leave' | 'remove'

type TeamConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  kind: TeamConfirmKind
  memberName?: string
  pending: boolean
  onConfirm: () => void
  t: (key: ShellStringKey) => string
}

export function TeamConfirmDialog({
  open,
  onOpenChange,
  kind,
  memberName,
  pending,
  onConfirm,
  t,
}: TeamConfirmDialogProps) {
  const title =
    kind === 'leave' ? t('teamLeaveConfirmTitle') : t('teamRemoveConfirmTitle')
  const description =
    kind === 'leave'
      ? t('teamLeaveConfirmDescription')
      : t('teamRemoveConfirmDescription').replace(
          '{name}',
          memberName?.trim() || t('teamColumnMember').toLowerCase(),
        )
  const confirmLabel =
    kind === 'leave' ? t('teamLeaveAction') : t('teamRemoveMember')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {t('teamInviteCancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={pending}
            className="gap-2"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
