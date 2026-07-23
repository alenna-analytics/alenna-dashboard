import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import { useMercadoLibreSyncBanner } from '@/components/integrations/use-mercadolibre-sync-banner'
import { useShopifySyncBanner } from '@/components/integrations/use-shopify-sync-banner'

export function PlatformSyncActivityHost() {
  const { data: connections } = usePlatformConnectionsQuery()
  useShopifySyncBanner(connections)
  useMercadoLibreSyncBanner(connections)
  return null
}
