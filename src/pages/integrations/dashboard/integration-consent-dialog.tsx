import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { useRequestedAccess } from '@/pages/integrations/hooks/use-requested-access'

const ACCESS_LABEL_KEYS: Record<string, ShellStringKey> = {
  orders: 'integrationAccessOrders',
  products: 'integrationAccessProducts',
  inventory: 'integrationAccessInventory',
  catalog: 'integrationAccessCatalog',
  finances: 'integrationAccessFinances',
  listings: 'integrationAccessListings',
  fees: 'integrationAccessFees',
  campaigns: 'integrationAccessCampaigns',
  spend: 'integrationAccessSpend',
  clicks: 'integrationAccessClicks',
  attributed_sales: 'integrationAccessAttributedSales',
}

type IntegrationConsentDialogProps = {
  lang: string
  slug: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function IntegrationConsentDialog({
  lang,
  slug,
  open,
  onOpenChange,
  onConfirm,
}: IntegrationConsentDialogProps) {
  const accessQuery = useRequestedAccess(slug, open)
  const items = accessQuery.data ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{shellT(lang, 'integrationConsentTitle')}</DialogTitle>
          <DialogDescription>{shellT(lang, 'integrationConsentBody')}</DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
          {items.map((item) => {
            const labelKey = ACCESS_LABEL_KEYS[item.key]
            return <li key={item.key}>{labelKey ? shellT(lang, labelKey) : item.label}</li>
          })}
        </ul>
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            {shellT(lang, 'integrationsDisconnectConfirmBack')}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {shellT(lang, 'integrationConsentContinue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
