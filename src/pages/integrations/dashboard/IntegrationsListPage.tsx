import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search, Settings } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useCurrentTenant } from '@/auth/hooks'
import { IntegrationManageSheet } from '@/pages/integrations/dashboard/integration-manage-sheet'
import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'
import { useShopifyIntegration } from '@/pages/integrations/details/use-shopify-integration'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { apiFetch } from '@/lib/api'
import type { PlatformConnection } from '@/lib/connectors-types'
import type { IntegrationSlug } from '@/lib/integrations-catalog'
import { getIntegrationBySlug, INTEGRATIONS } from '@/lib/integrations-catalog'
import { shellT } from '@/lib/shell-strings'
import { Button } from '@/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { Input } from '@/ui/input'
import { Switch } from '@/ui/switch'
import { cn } from '@/lib/utils'

export function IntegrationsListPage() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { lang } = useLanguage()
  const [q, setQ] = useState('')
  const [managedSlug, setManagedSlug] = useState<IntegrationSlug | null>(null)
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)

  const shopifyIntegration = useShopifyIntegration()
  const { isAdmin, connected: shopifyConnected, disconnectMutation } =
    shopifyIntegration

  const { isLoading, error } = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as PlatformConnection[]
    },
  })

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return INTEGRATIONS
    return INTEGRATIONS.filter((i) => {
      const name = shellT(lang, i.nameKey).toLowerCase()
      const cat = shellT(lang, i.categoryKey).toLowerCase()
      return name.includes(needle) || cat.includes(needle)
    })
  }, [q, lang])

  const managed = managedSlug ? getIntegrationBySlug(managedSlug) : undefined

  return (
    <DashboardPage className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
          {shellT(lang, 'integrationsHeroTitle')}
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-text-secondary">
          {shellT(lang, 'integrationsHeroSubtitle')}
        </p>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={shellT(lang, 'integrationsSearchPlaceholder')}
          className="h-10 rounded-lg border-border-subtle bg-bg-surface pl-9 pr-3"
          aria-label={shellT(lang, 'integrationsSearchPlaceholder')}
        />
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {shellT(lang, 'connectionsLoading')}
        </p>
      ) : error ? (
        <p className="text-sm text-destructive" role="alert">
          {error instanceof Error ? error.message : String(error)}
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {shellT(lang, 'integrationsEmptySearch')}
        </p>
      ) : (
        <ul className="grid list-none gap-4 sm:grid-cols-2">
          {filtered.map((integration) => {
            const name = shellT(lang, integration.nameKey)
            const desc = shellT(lang, integration.shortDescKey)
            const isShopify = integration.slug === 'shopify'
            const switchChecked = isShopify ? shopifyConnected : false
            const switchDisabled =
              !integration.available ||
              !isShopify ||
              (isShopify && (!isAdmin || disconnectMutation.isPending))

            const onSwitchChange = (on: boolean) => {
              if (!integration.available || !isShopify) return
              if (!isAdmin) return
              if (on) {
                setManagedSlug('shopify')
                return
              }
              if (!shopifyConnected) return
              setDisconnectDialogOpen(true)
            }

            return (
              <li key={integration.slug}>
                <Card
                  size="sm"
                  variant="solid"
                  className={cn(
                    'h-full border-border-subtle shadow-sm transition-shadow hover:border-border-default hover:shadow-md',
                    'hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]',
                  )}
                >
                  <CardHeader className="flex flex-col items-start gap-3 border-0 pb-0">
                    <IntegrationLogo src={integration.logoSrc} alt={name} size="xl" />
                    <div className="min-w-0 flex-1 flex flex-col">
                      <CardTitle className="text-base! font-semibold tracking-tight">{name}</CardTitle>
                      <CardDescription className="mt-1.5 line-clamp-2 text-md! leading-relaxed">
                        {desc}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex flex-row flex-wrap items-center justify-between gap-3 border-border-subtle bg-transparent">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 text-sm"
                      onClick={() => setManagedSlug(integration.slug)}
                    >
                      <Settings className="size-4" aria-hidden />
                      {shellT(lang, 'integrationsActionManage')}
                    </Button>
                    <Switch
                      checked={switchChecked}
                      disabled={switchDisabled}
                      onCheckedChange={onSwitchChange}
                      aria-label={shellT(lang, 'integrationsToggleLabel')}
                    />
                  </CardFooter>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      {managed ? (
        <IntegrationManageSheet
          definition={managed}
          open={managedSlug !== null}
          onOpenChange={(open) => {
            if (!open) setManagedSlug(null)
          }}
          shopify={managed.slug === 'shopify' ? shopifyIntegration : undefined}
        />
      ) : null}

      <Dialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{shellT(lang, 'integrationsDisconnectDialogTitle')}</DialogTitle>
            <DialogDescription>
              {shellT(lang, 'integrationsConfirmDisconnect')}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={disconnectMutation.isPending}
              onClick={() => setDisconnectDialogOpen(false)}
            >
              {shellT(lang, 'integrationsDialogCancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={disconnectMutation.isPending}
              className="gap-2"
              onClick={() => {
                disconnectMutation.mutate(undefined, {
                  onSettled: () => setDisconnectDialogOpen(false),
                })
              }}
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {shellT(lang, 'integrationsDialogConfirmDisconnect')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardPage>
  )
}
