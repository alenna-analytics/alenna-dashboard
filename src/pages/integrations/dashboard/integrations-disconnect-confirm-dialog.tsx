import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'

type IntegrationsDisconnectConfirmDialogProps = {
  lang: string
  open: boolean
  onOpenChange: (open: boolean) => void
  purgeData: boolean
  disconnectPending: boolean
  onBack: () => void
  onConfirmDisconnect: () => void
}

export function IntegrationsDisconnectConfirmDialog({
  lang,
  open,
  onOpenChange,
  purgeData,
  disconnectPending,
  onBack,
  onConfirmDisconnect,
}: IntegrationsDisconnectConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{shellT(lang, 'integrationsDisconnectDialogTitle')}</DialogTitle>
          <DialogDescription>
            {purgeData
              ? shellT(lang, 'integrationsDisconnectConfirmPurge')
              : shellT(lang, 'integrationsConfirmDisconnect')}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={disconnectPending} onClick={onBack}>
            {shellT(lang, 'integrationsDisconnectConfirmBack')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={disconnectPending}
            className="gap-2"
            onClick={onConfirmDisconnect}
          >
            {purgeData
              ? shellT(lang, 'integrationsDialogConfirmDisconnectAndPurge')
              : shellT(lang, 'integrationsDialogConfirmDisconnect')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
