import { Check } from 'lucide-react'

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

const ACCESS_DESC_KEYS: Record<string, ShellStringKey> = {
  orders: 'integrationAccessOrdersDesc',
  products: 'integrationAccessProductsDesc',
  inventory: 'integrationAccessInventoryDesc',
  catalog: 'integrationAccessCatalogDesc',
  finances: 'integrationAccessFinancesDesc',
  listings: 'integrationAccessListingsDesc',
  fees: 'integrationAccessFeesDesc',
  campaigns: 'integrationAccessCampaignsDesc',
  spend: 'integrationAccessSpendDesc',
  clicks: 'integrationAccessClicksDesc',
  attributed_sales: 'integrationAccessAttributedSalesDesc',
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
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{shellT(lang, 'integrationConsentTitle')}</DialogTitle>
          <DialogDescription>{shellT(lang, 'integrationConsentBody')}</DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border-subtle bg-muted/25 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
            {shellT(lang, 'integrationConsentSectionLabel')}
          </p>
          {accessQuery.isLoading ? (
            <ul className="mt-3 space-y-3" aria-busy="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex gap-3">
                  <div className="mt-0.5 size-4 shrink-0 animate-pulse rounded-sm bg-muted" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full max-w-sm animate-pulse rounded bg-muted/80" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-3 space-y-3">
              {items.map((item) => {
                const labelKey = ACCESS_LABEL_KEYS[item.key]
                const descKey = ACCESS_DESC_KEYS[item.key]
                const label = labelKey ? shellT(lang, labelKey) : item.label
                const description = descKey ? shellT(lang, descKey) : null
                return (
                  <li key={item.key} className="flex gap-3">
                    <span
                      className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border border-[color-mix(in_srgb,var(--country-green-base)_55%,white)] bg-[color-mix(in_srgb,var(--country-green-base)_12%,white)] text-[var(--country-green-base)]"
                      aria-hidden
                    >
                      <Check className="size-3 stroke-[2.5]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug text-text-primary">{label}</p>
                      {description ? (
                        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                          {description}
                        </p>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <p className="text-xs leading-relaxed text-text-tertiary">
          {shellT(lang, 'integrationConsentRedirectNote')}
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            {shellT(lang, 'integrationsDialogCancel')}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={accessQuery.isLoading}>
            {shellT(lang, 'integrationConsentContinue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
