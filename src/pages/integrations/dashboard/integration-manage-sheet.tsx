import { Loader2 } from 'lucide-react'

import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'
import type { ShopifyIntegrationHook } from '@/pages/integrations/details/use-shopify-integration'
import type { ManagedIntegration } from '@/lib/integrations/catalog'
import {
  normalizeShopifySubdomainInput,
  SHOPIFY_MYSHOPIFY_SUFFIX,
} from '@/lib/integrations/shopify-format'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
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

function SheetHeaderWithLogo({
  definition,
  title,
}: {
  definition: ManagedIntegration
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

function ShopifyIntroCopy({ lang }: { lang: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      {shellT(lang, 'integrationSheetShopifyConnectIntro')}
    </p>
  )
}

function PlaceholderManageBody({ definition }: { definition: ManagedIntegration }) {
  const { lang } = useLanguage()
  const name = definition.nameKey
    ? shellT(lang, definition.nameKey)
    : definition.catalogName
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
  definition: ManagedIntegration
  shopify: ShopifyIntegrationHook
}) {
  const { lang } = useLanguage()
  const {
    tenantId,
    isAdmin,
    shopInput,
    setShopInput,
    startOAuth,
    oauthStarting,
    isLoading,
    error,
    activeConnection,
    connected,
    activeConnectionId,
    disconnectMutation,
    previewMessage,
  } = shopify

  const name = definition.nameKey
    ? shellT(lang, definition.nameKey)
    : definition.catalogName
  const storeId = 'integration-shop-domain-sheet'
  const shopSubdomain = normalizeShopifySubdomainInput(
    activeConnection?.shop_domain ?? '',
  )

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
            <ShopifyIntroCopy lang={lang} />
            <div className="space-y-2">
              <Label htmlFor={storeId}>{shellT(lang, 'connectionsConnectShopLabel')}</Label>
              <div
                className="flex h-10 min-h-10 min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-background shadow-xs ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                role="group"
                aria-label={shellT(lang, 'connectionsConnectShopLabel')}
              >
                <Input
                  id={storeId}
                  placeholder={shellT(lang, 'connectionsConnectShopPlaceholder')}
                  value={shopInput}
                  onChange={(e) =>
                    setShopInput(normalizeShopifySubdomainInput(e.target.value))
                  }
                  autoComplete="off"
                  className="h-full min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-2.5 py-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <span
                  className="flex shrink-0 items-center border-l border-input bg-muted px-3 text-sm text-muted-foreground"
                  aria-hidden
                >
                  {SHOPIFY_MYSHOPIFY_SUFFIX}
                </span>
              </div>
            </div>
            <Button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
              size="lg"
              disabled={
                oauthStarting ||
                !normalizeShopifySubdomainInput(shopInput) ||
                !tenantId
              }
              onClick={() => void startOAuth()}
            >
              {oauthStarting ? (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              ) : null}
              {shellT(lang, 'integrationConnectWithShopify')}
            </Button>
            {previewMessage && !oauthStarting ? (
              <p className="text-sm text-destructive" role="alert">
                {previewMessage}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">{shellT(lang, 'integrationDetailHeroHelper')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ShopifyIntroCopy lang={lang} />
            <div className="space-y-2">
              <Label htmlFor={`${storeId}-ro`}>{shellT(lang, 'connectionsConnectShopLabel')}</Label>
              <div
                className="flex h-10 min-h-10 min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-muted/60 text-sm text-foreground shadow-xs"
                role="group"
                aria-label={shellT(lang, 'connectionsConnectShopLabel')}
              >
                <div id={`${storeId}-ro`} className="min-w-0 flex-1 truncate px-2.5 py-2 text-muted-foreground">
                  {shopSubdomain}
                </div>
                <span
                  className="flex shrink-0 items-center border-l border-input bg-muted px-3 text-sm text-muted-foreground"
                  aria-hidden
                >
                  {SHOPIFY_MYSHOPIFY_SUFFIX}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{shellT(lang, 'integrationDetailHeroHelper')}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="inline-flex w-full items-center justify-center gap-2 border-destructive/35 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
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
