import { LoadingIcon } from '@/ui/app-icon'

import type { MercadoLibreIntegrationHook } from '@/pages/integrations/details/use-mercadolibre-integration'
import type { ShopifyIntegrationHook } from '@/pages/integrations/details/use-shopify-integration'
import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import { Sheet, SheetContent, SheetFooter } from '@/ui/sheet'
import { MercadoLibreManageBody } from '@/pages/integrations/dashboard/mercadolibre/manage-body'
import {
  SheetHeaderWithLogo,
  ShopifyManageBody,
} from './shopify/manage-body'

type IntegrationManageSheetProps = {
  definition: ManagedIntegration
  open: boolean
  onOpenChange: (open: boolean) => void
  shopify?: ShopifyIntegrationHook
  mercadolibre?: MercadoLibreIntegrationHook
}

export function IntegrationManageSheet({
  definition,
  open,
  onOpenChange,
  shopify,
  mercadolibre,
}: IntegrationManageSheetProps) {
  const { lang } = useLanguage()
  const showShopifyDisconnect = Boolean(
    definition.slug === 'shopify' && shopify && shopify.isAdmin && shopify.connected,
  )
  const showMeliDisconnect = Boolean(
    definition.slug === 'mercadolibre' &&
      mercadolibre &&
      mercadolibre.isAdmin &&
      mercadolibre.connected,
  )
  const showDisconnectFooter = showShopifyDisconnect || showMeliDisconnect

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {definition.slug === 'shopify' && shopify ? (
          <ShopifyManageBody definition={definition} shopify={shopify} />
        ) : definition.slug === 'mercadolibre' && mercadolibre ? (
          <MercadoLibreManageBody definition={definition} meli={mercadolibre} />
        ) : (
          <PlaceholderManageBody definition={definition} />
        )}
        {showDisconnectFooter ? (
          <SheetFooter className="bg-glass-fill-raised sm:justify-start">
            <Button
              type="button"
              variant="outline"
              className="inline-flex items-center justify-center gap-2 border-destructive/35 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={
                (shopify?.disconnectMutation.isPending ||
                  mercadolibre?.disconnectMutation.isPending) ??
                false
              }
              onClick={() => {
                if (definition.slug === 'shopify' && shopify) {
                  shopify.disconnectMutation.mutate()
                } else if (definition.slug === 'mercadolibre' && mercadolibre) {
                  mercadolibre.disconnectMutation.mutate()
                }
              }}
            >
              {shopify?.disconnectMutation.isPending ||
              mercadolibre?.disconnectMutation.isPending ? (
                <LoadingIcon className="size-4 shrink-0" />
              ) : null}
              {shellT(lang, 'integrationDetailDisconnect')}
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function PlaceholderManageBody({ definition }: { definition: ManagedIntegration }) {
  const { lang } = useLanguage()
  const name = definition.nameKey
    ? shellT(lang, definition.nameKey)
    : definition.catalogName
  return <SheetHeaderWithLogo definition={definition} title={name} />
}
