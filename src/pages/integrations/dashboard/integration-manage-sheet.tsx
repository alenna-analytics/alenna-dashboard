import { Loader2 } from 'lucide-react'

import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'
import type { ShopifyIntegrationHook } from '@/pages/integrations/details/use-shopify-integration'
import type { IntegrationDefinition } from '@/lib/integrations-catalog'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/shell-strings'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'

type IntegrationManageSheetProps = {
  definition: IntegrationDefinition
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

function SheetHeaderWithLogo({
  definition,
  title,
}: {
  definition: IntegrationDefinition
  title: string
}) {
  return (
    <SheetHeader className="flex flex-row items-center gap-3">
      <IntegrationLogo src={definition.logoSrc} alt={title} size="xl" className="pt-0.5" />
      <div className="min-w-0 flex-1 space-y-1">
        <SheetTitle>{title}</SheetTitle>
      </div>
    </SheetHeader>
  )
}

function PlaceholderManageBody({ definition }: { definition: IntegrationDefinition }) {
  const { lang } = useLanguage()
  const name = shellT(lang, definition.nameKey)
  return (
    <SheetHeaderWithLogo
      definition={definition}
      title={name}
    />
  )
}

function ShopifyManageBody({
  definition,
  shopify,
}: {
  definition: IntegrationDefinition
  shopify: ShopifyIntegrationHook
}) {
  const { lang } = useLanguage()
  const {
    tenantId,
    isAdmin,
    shopInput,
    setShopInput,
    startOAuth,
    isLoading,
    error,
    activeConnection,
    connected,
    activeConnectionId,
    disconnectMutation,
  } = shopify

  const name = shellT(lang, definition.nameKey)
  const storeId = 'integration-shop-domain-sheet'

  return (
    <>
      <SheetHeaderWithLogo definition={definition} title={name} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
        {!isAdmin ? (
          <p className="text-sm text-muted-foreground">{shellT(lang, 'connectionsAdminOnly')}</p>
        ) : isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {shellT(lang, 'connectionsLoading')}
          </p>
        ) : error ? (
          <p className="text-sm text-destructive" role="alert">
            {error instanceof Error ? error.message : String(error)}
          </p>
        ) : !connected ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={storeId}>{shellT(lang, 'connectionsConnectShopLabel')}</Label>
              <Input
                id={storeId}
                placeholder={shellT(lang, 'connectionsConnectShopPlaceholder')}
                value={shopInput}
                onChange={(e) => setShopInput(e.target.value)}
                autoComplete="off"
              />
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={!shopInput.trim() || !tenantId}
              onClick={() => void startOAuth()}
            >
              {shellT(lang, 'integrationConnectWithShopify')}
            </Button>
            <p className="text-xs text-muted-foreground">{shellT(lang, 'integrationDetailHeroHelper')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${storeId}-ro`}>{shellT(lang, 'connectionsConnectShopLabel')}</Label>
              <Input
                id={`${storeId}-ro`}
                readOnly
                value={activeConnection?.shop_domain ?? activeConnection?.id ?? ''}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
              disabled={disconnectMutation.isPending || !activeConnectionId}
              onClick={() => disconnectMutation.mutate()}
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              ) : null}
              {shellT(lang, 'integrationDetailDisconnect')}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
