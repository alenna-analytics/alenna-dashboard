import { useState } from 'react'

import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { cn } from '@/lib/utils'

export type DisconnectDataChoice = 'keep' | 'purge'

type IntegrationsDisconnectDataDialogProps = {
  lang: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinue: (choice: DisconnectDataChoice) => void
}

export function IntegrationsDisconnectDataDialog({
  lang,
  open,
  onOpenChange,
  onContinue,
}: IntegrationsDisconnectDataDialogProps) {
  const [choice, setChoice] = useState<DisconnectDataChoice>('keep')

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setChoice('keep')
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{shellT(lang, 'integrationsDisconnectDataDialogTitle')}</DialogTitle>
          <DialogDescription>
            {shellT(lang, 'integrationsDisconnectDataDialogDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          <label
            className={cn(
              'flex cursor-pointer gap-3 rounded-md border p-3',
              choice === 'keep' ? 'border-border-strong bg-bg-subtle' : 'border-border-default',
            )}
          >
            <input
              type="radio"
              name="disconnect-data-choice"
              checked={choice === 'keep'}
              onChange={() => setChoice('keep')}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-text-primary">
                {shellT(lang, 'integrationsDisconnectKeepDataTitle')}
              </span>
              <span className="mt-1 block text-sm text-text-secondary">
                {shellT(lang, 'integrationsDisconnectKeepDataDescription')}
              </span>
            </span>
          </label>
          <label
            className={cn(
              'flex cursor-pointer gap-3 rounded-md border p-3',
              choice === 'purge' ? 'border-border-strong bg-bg-subtle' : 'border-border-default',
            )}
          >
            <input
              type="radio"
              name="disconnect-data-choice"
              checked={choice === 'purge'}
              onChange={() => setChoice('purge')}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-text-primary">
                {shellT(lang, 'integrationsDisconnectPurgeDataTitle')}
              </span>
              <span className="mt-1 block text-sm text-text-secondary">
                {shellT(lang, 'integrationsDisconnectPurgeDataDescription')}
              </span>
            </span>
          </label>
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            {shellT(lang, 'integrationsDialogCancel')}
          </Button>
          <Button type="button" variant="accent" onClick={() => onContinue(choice)}>
            {shellT(lang, 'integrationsDisconnectDataContinue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
