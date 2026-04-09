import { useCurrentTenant } from '@/auth/hooks'
import { useLanguage } from '@/components/providers/language-provider'
import { usePageChrome } from '@/components/providers/page-chrome-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ConnectorDefinition } from '@/features/connectors/connector-definitions'
import { CONNECTOR_DEFINITIONS } from '@/features/connectors/connector-definitions'
import { ConnectorIntegrationCard } from '@/features/connectors/ConnectorIntegrationCard'
import { ConnectorsPageSkeleton } from '@/features/connectors/ConnectorsPageSkeleton'
import {
  useConnectorsList,
  useShopifyAuthorizationUrl,
  useShopifyDisconnect,
  useShopifySync,
} from '@/hooks/use-connectors'
import {
  connectionsLastRunSummary,
  connectionsT,
  connectorCardCopy,
} from '@/lib/connections-strings'
import { PlugIcon } from 'lucide-react'
import { enUS, es } from 'date-fns/locale'
import { useEffect, useMemo, useState } from 'react'

function definitionById(id: ConnectorDefinition['id']): ConnectorDefinition {
  const d = CONNECTOR_DEFINITIONS.find((c) => c.id === id)
  if (!d) throw new Error(`Unknown connector: ${id}`)
  return d
}

export function ConnectorsPage() {
  const { lang } = useLanguage()
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
  const isSyncing = syncMutation.isPending
  const dateLocale = lang === 'es' ? es : enUS

  const shopifyDef = useMemo(() => definitionById('shopify'), [])
  const shopifyCopy = useMemo(() => connectorCardCopy(lang, 'shopify'), [lang])

  useEffect(() => {
    setPageMeta({ title: connectionsT(lang, 'pageTitle') })
    return () => setPageMeta({ title: '' })
  }, [lang, setPageMeta])

  const onConnectShopify = () => {
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

  const lastRunLine =
    syncMutation.isSuccess && syncMutation.data
      ? connectionsLastRunSummary(
          lang,
          syncMutation.data.catalog_products_upserted,
          syncMutation.data.records_synced,
        )
      : null

  const otherAvailable = CONNECTOR_DEFINITIONS.filter((c) => c.id !== 'shopify')

  if (listQuery.isLoading) {
    return <ConnectorsPageSkeleton />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-1 pb-12">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <PlugIcon className="size-5" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-wider">
            {connectionsT(lang, 'pageEyebrow')}
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{connectionsT(lang, 'pageTitle')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {connectionsT(lang, 'pageSubtitle')}
        </p>
      </header>

      {listQuery.isError && (
        <p className="text-sm text-destructive">
          {listQuery.error instanceof Error ? listQuery.error.message : connectionsT(lang, 'loadError')}
        </p>
      )}

      {!listQuery.isError && (
        <div className="space-y-12">
          {shopify ? (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                {connectionsT(lang, 'sectionConnected')}
              </h2>
              <div className="space-y-4">
                <ConnectorIntegrationCard
                  definition={shopifyDef}
                  copy={shopifyCopy}
                  dateLocale={dateLocale}
                  mode="connected"
                  canManage={canManage}
                  isSyncing={isSyncing}
                  storeName={shopify.shop_domain}
                  lastSyncAt={shopify.last_synced_at}
                  statusText={
                    shopify.connection_status
                      ? `${connectionsT(lang, 'apiStatusPrefix')} ${shopify.connection_status}`
                      : null
                  }
                  lastError={shopify.last_error}
                  onSync={onSync}
                  onDisconnect={() => disconnectMutation.mutate()}
                  disconnectPending={disconnectMutation.isPending}
                  syncError={
                    syncMutation.isError && syncMutation.error instanceof Error
                      ? syncMutation.error.message
                      : null
                  }
                  disconnectError={
                    disconnectMutation.isError && disconnectMutation.error instanceof Error
                      ? disconnectMutation.error.message
                      : null
                  }
                  lastRunSummaryLine={lastRunLine}
                  advancedContent={
                    <div className="grid max-w-xl gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sync-start">{connectionsT(lang, 'startDateOptional')}</Label>
                        <Input
                          id="sync-start"
                          type="date"
                          value={startDate}
                          disabled={isSyncing}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sync-end">{connectionsT(lang, 'endDateOptional')}</Label>
                        <Input
                          id="sync-end"
                          type="date"
                          value={endDate}
                          disabled={isSyncing}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                      <label className="flex items-start gap-2 text-sm sm:col-span-2">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={fullSync}
                          disabled={isSyncing}
                          onChange={(e) => setFullSync(e.target.checked)}
                        />
                        <span>{connectionsT(lang, 'backfillLabel')}</span>
                      </label>
                    </div>
                  }
                />
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {connectionsT(lang, 'sectionAvailable')}
            </h2>
            <div className="space-y-4">
              {!shopify ? (
                <ConnectorIntegrationCard
                  definition={shopifyDef}
                  copy={shopifyCopy}
                  dateLocale={dateLocale}
                  mode="disconnected"
                  canManage={canManage}
                  connectDisabled={!shopInput.trim()}
                  connectPending={authUrlMutation.isPending}
                  connectError={
                    authUrlMutation.isError && authUrlMutation.error instanceof Error
                      ? authUrlMutation.error.message
                      : null
                  }
                  onConnect={onConnectShopify}
                  setupContent={
                    <div className="space-y-2">
                      <Label htmlFor="shop-domain" className="text-muted-foreground">
                        {connectionsT(lang, 'storeDomainLabel')}
                      </Label>
                      <Input
                        id="shop-domain"
                        placeholder={connectionsT(lang, 'storeDomainPlaceholder')}
                        value={shopInput}
                        onChange={(e) => setShopInput(e.target.value)}
                        className="max-w-md"
                      />
                    </div>
                  }
                />
              ) : null}

              {otherAvailable.map((def) => (
                <ConnectorIntegrationCard
                  key={def.id}
                  definition={def}
                  copy={connectorCardCopy(lang, def.id)}
                  dateLocale={dateLocale}
                  mode="coming_soon"
                  canManage={canManage}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
