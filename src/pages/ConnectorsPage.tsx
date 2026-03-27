import { usePageChrome } from '@/components/providers/page-chrome-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCurrentTenant } from '@/auth/hooks'
import {
  useConnectorsList,
  useShopifyAuthorizationUrl,
  useShopifyDisconnect,
  useShopifySync,
} from '@/hooks/use-connectors'
import { PlugIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ConnectorsPage() {
  const { setPageMeta } = usePageChrome()
  const { role } = useCurrentTenant()
  const listQuery = useConnectorsList()
  const authUrlMutation = useShopifyAuthorizationUrl()
  const syncMutation = useShopifySync()
  const disconnectMutation = useShopifyDisconnect()
  const [shopInput, setShopInput] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [fullSync, setFullSync] = useState(false)

  const canManage = role === 'admin' || role === 'owner'
  const shopify = listQuery.data?.find((c) => c.platform === 'shopify')

  useEffect(() => {
    setPageMeta({ title: 'Connectors' })
    return () => setPageMeta({ title: '' })
  }, [setPageMeta])

  const onConnect = () => {
    if (!shopInput.trim()) return
    authUrlMutation.mutate(shopInput, {
      onSuccess: (data) => {
        window.location.href = data.url
      },
    })
  }

  const onSync = () => {
    syncMutation.mutate({
      start_date: startDate || null,
      end_date: endDate || null,
      full: fullSync,
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <PlugIcon className="size-6 text-text-secondary" />
        <h1 className="text-lg font-semibold tracking-tight">Connectors</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shopify</CardTitle>
          <CardDescription>
            Connect your store with OAuth, then sync orders into analytics. Admin API (GraphQL).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {listQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Loading connection status…</p>
          )}
          {listQuery.isError && (
            <p className="text-sm text-destructive">
              {listQuery.error instanceof Error ? listQuery.error.message : 'Failed to load'}
            </p>
          )}
          {shopify && (
            <div className="space-y-1 rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p>
                <span className="text-muted-foreground">Shop: </span>
                {shopify.shop_domain ?? '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Status: </span>
                {shopify.connection_status}
                {shopify.last_error ? (
                  <span className="ml-2 text-destructive">({shopify.last_error})</span>
                ) : null}
              </p>
              {shopify.last_synced_at && (
                <p>
                  <span className="text-muted-foreground">Last sync: </span>
                  {new Date(shopify.last_synced_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {!canManage && (
            <p className="text-sm text-muted-foreground">
              Only workspace admins can connect or sync stores.
            </p>
          )}

          {canManage && !shopify && (
            <div className="space-y-2">
              <Label htmlFor="shop-domain">Shop domain</Label>
              <Input
                id="shop-domain"
                placeholder="your-store or your-store.myshopify.com"
                value={shopInput}
                onChange={(e) => setShopInput(e.target.value)}
              />
              <Button
                type="button"
                disabled={authUrlMutation.isPending || !shopInput.trim()}
                onClick={() => onConnect()}
              >
                {authUrlMutation.isPending ? 'Redirecting…' : 'Connect Shopify'}
              </Button>
              {authUrlMutation.isError && (
                <p className="text-sm text-destructive">
                  {authUrlMutation.error instanceof Error
                    ? authUrlMutation.error.message
                    : 'Could not start OAuth'}
                </p>
              )}
            </div>
          )}

          {canManage && shopify && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sync-start">Start date (optional)</Label>
                  <Input
                    id="sync-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sync-end">End date (optional)</Label>
                  <Input
                    id="sync-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={fullSync}
                  onChange={(e) => setFullSync(e.target.checked)}
                />
                Wide backfill (~2 years, created_at)
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" disabled={syncMutation.isPending} onClick={() => onSync()}>
                  {syncMutation.isPending ? 'Syncing…' : 'Sync now'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={disconnectMutation.isPending}
                  onClick={() => disconnectMutation.mutate()}
                >
                  Disconnect
                </Button>
              </div>
              {syncMutation.isSuccess && (
                <p className="text-sm text-muted-foreground">
                  Synced {syncMutation.data.records_synced} order(s).
                </p>
              )}
              {syncMutation.isError && (
                <p className="text-sm text-destructive">
                  {syncMutation.error instanceof Error
                    ? syncMutation.error.message
                    : 'Sync failed'}
                </p>
              )}
              {disconnectMutation.isError && (
                <p className="text-sm text-destructive">
                  {disconnectMutation.error instanceof Error
                    ? disconnectMutation.error.message
                    : 'Disconnect failed'}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
