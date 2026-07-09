import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import { Checkbox } from '@/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

type DeleteAccountDialogProps = {
  lang: string
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceName: string
  scheduledPurgePreview: string
  confirmName: string
  onConfirmNameChange: (value: string) => void
  understood: boolean
  onUnderstoodChange: (value: boolean) => void
  pending: boolean
  onConfirm: () => void
}

export function DeleteAccountDialog({
  lang,
  open,
  onOpenChange,
  workspaceName,
  scheduledPurgePreview,
  confirmName,
  onConfirmNameChange,
  understood,
  onUnderstoodChange,
  pending,
  onConfirm,
}: DeleteAccountDialogProps) {
  const nameMatches =
    confirmName.trim().length > 0 &&
    confirmName.trim().toLowerCase() === workspaceName.trim().toLowerCase()
  const canConfirm = understood && nameMatches && !pending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{shellT(lang, 'settingsDeleteAccountDialogTitle')}</DialogTitle>
          <DialogDescription className="space-y-2 pt-1 text-sm text-text-secondary">
            <p>{shellT(lang, 'settingsDeleteAccountDialogLine1')}</p>
            <p>{shellT(lang, 'settingsDeleteAccountDialogLine2')}</p>
            <p>
              {shellT(lang, 'settingsDeleteAccountDialogLine3', {
                date: scheduledPurgePreview,
              })}
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              checked={understood}
              onCheckedChange={(v) => onUnderstoodChange(v === true)}
              disabled={pending}
            />
            <span className="text-sm leading-snug text-text-secondary">
              {shellT(lang, 'settingsDeleteAccountDialogCheckbox')}
            </span>
          </label>
          <div className="space-y-2">
            <Label htmlFor="delete-account-confirm-name" className="text-sm">
              {shellT(lang, 'settingsDeleteAccountConfirmPlaceholder')}
            </Label>
            <Input
              id="delete-account-confirm-name"
              value={confirmName}
              onChange={(e) => onConfirmNameChange(e.target.value)}
              placeholder={workspaceName}
              disabled={pending}
              autoComplete="off"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {shellT(lang, 'settingsDeleteAccountCancelButton')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={pending}
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            {shellT(lang, 'settingsDeleteAccountConfirmButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
