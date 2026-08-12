import { useAuth } from '@clerk/react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  createCustomerPortalSession,
  redirectToStripe,
} from '@/lib/billing/billing-api'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'

export function CancelSubscriptionButton() {
  const { getToken } = useAuth()
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!me || me.role !== 'owner' || !me.has_stripe_subscription) return null

  async function handleConfirm() {
    if (!me) return
    setLoading(true)
    try {
      const url = await createCustomerPortalSession((args) => getToken(args), me.tenant_id)
      redirectToStripe(url)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Portal failed'
      toast.error(message)
      setLoading(false)
    }
  }

  return (
    <>
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        {shellT(lang, 'billingCancelSubscription')}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !loading && setOpen(next)}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{shellT(lang, 'billingCancelDialogTitle')}</DialogTitle>
            <DialogDescription>{shellT(lang, 'billingCancelDialogBody')}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              {shellT(lang, 'billingCancelDialogBack')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={loading}
              onClick={() => void handleConfirm()}
            >
              {shellT(lang, 'billingCancelDialogConfirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
