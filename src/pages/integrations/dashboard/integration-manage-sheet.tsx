import { Loader2 } from 'lucide-react'

import type { ShopifyIntegrationHook } from '@/pages/integrations/details/use-shopify-integration'
import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import { Sheet, SheetContent, SheetFooter } from '@/ui/sheet'
import {
  SheetHeaderWithLogo,
  ShopifyManageBody,
} from './shopify/manage-body'

type IntegrationManageSheetProps = {
  definition: ManagedIntegration
  open: boolean
  onOpenChange: (open: boolean) => void
  shopify?: ShopifyIntegrationHook
}

export function IntegrationManageSheet({
  definition,
  open,
  onOpenChange,
  shopify,
}: IntegrationManageSheetProps) {
  const { lang } = useLanguage()
  const showDisconnectFooter = Boolean(
    definition.slug === 'shopify' &&
      shopify &&
      shopify.isAdmin &&
      shopify.connected
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {definition.slug === 'shopify' && shopify ? (
          <ShopifyManageBody definition={definition} shopify={shopify} />
        ) : (
          <PlaceholderManageBody definition={definition} />
        )}
        {showDisconnectFooter && shopify ? (
          <SheetFooter className="bg-glass-fill-raised sm:justify-start">
            <Button
              type="button"
              variant="outline"
              className="inline-flex items-center justify-center gap-2 border-destructive/35 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={shopify.disconnectMutation.isPending || !shopify.activeConnectionId}
              onClick={() => shopify.disconnectMutation.mutate()}
            >
              {shopify.disconnectMutation.isPending ? (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
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
