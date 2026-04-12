import type { ShopifyIntegrationHook } from '@/pages/integrations/details/use-shopify-integration'
import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import { Sheet, SheetContent } from '@/ui/sheet'
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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {definition.slug === 'shopify' && shopify ? (
          <ShopifyManageBody definition={definition} shopify={shopify} />
        ) : (
          <PlaceholderManageBody definition={definition} />
        )}
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
