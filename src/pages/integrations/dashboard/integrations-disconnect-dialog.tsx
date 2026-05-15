import { Loader2 } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'

type IntegrationsDisconnectDialogProps = {
  lang: string
  open: boolean
  onOpenChange: (open: boolean) => void
  disconnectPending: boolean
  onConfirmDisconnect: () => void
}

export function IntegrationsDisconnectDialog({
  lang,
  open,
  onOpenChange,
  disconnectPending,
  onConfirmDisconnect,
}: IntegrationsDisconnectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{shellT(lang, 'integrationsDisconnectDialogTitle')}</DialogTitle>
          <DialogDescription>
            {shellT(lang, 'integrationsConfirmDisconnect')}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={disconnectPending}
            onClick={() => onOpenChange(false)}
          >
            {shellT(lang, 'integrationsDialogCancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={disconnectPending}
            className="gap-2"
            onClick={onConfirmDisconnect}
          >
            {disconnectPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {shellT(lang, 'integrationsDialogConfirmDisconnect')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
