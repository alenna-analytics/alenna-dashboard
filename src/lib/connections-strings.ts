import type { ConnectorCardCopy } from '@/features/connectors/connector-card-copy'
import type { ConnectorPlatformId } from '@/features/connectors/connector-definitions'

const CONNECTIONS_STRINGS = {
  es: {
    pageEyebrow: 'Espacio de trabajo',
    pageTitle: 'Conexiones',
    pageSubtitle:
      'Conecta canales de venta para sincronizar pedidos y catálogo en analítica. Cada integración se gestiona por separado.',
    sectionConnected: 'Conectadas',
    sectionAvailable: 'Disponibles',
    loadingStatus: 'Cargando estado de conexiones…',
    loadError: 'No se pudieron cargar las conexiones',
    statusColumn: 'Estado',
    statusConnected: 'Conectada',
    statusNotConnected: 'Sin conectar',
    statusNotAvailable: 'No disponible',
    lastSyncPrefix: 'Última sincronización',
    noSyncYet: 'Aún sin sincronizar',
    activeBadge: 'Activa',
    comingSoonBadge: 'Próximamente',
    connect: 'Conectar',
    sync: 'Sincronizar',
    syncing: 'Sincronizando…',
    disconnect: 'Desconectar',
    disconnecting: 'Desconectando…',
    redirecting: 'Redirigiendo…',
    advanced: 'Opciones avanzadas',
    hideOptions: 'Ocultar opciones',
    comingSoonButton: 'Próximamente',
    adminsOnly: 'Solo administradores pueden conectar y sincronizar.',
    syncProgressTitle: 'Sincronizando datos…',
    syncElapsed: 'transcurridos',
    syncProgressHint:
      'Puede tardar varios minutos en tiendas grandes. Puedes salir cuando termine.',
    lastRunSummary: (catalog: number, orders: number) =>
      `Última ejecución: ${catalog} SKU en catálogo, ${orders} filas de pedidos.`,
    storeDomainLabel: 'Dominio de la tienda',
    storeDomainPlaceholder: 'tu-tienda o tu-tienda.myshopify.com',
    startDateOptional: 'Fecha inicial (opcional)',
    endDateOptional: 'Fecha final (opcional)',
    backfillLabel:
      'Backfill amplio (~2 años en el filtro). Sin el scope read_all_orders en OAuth, Shopify solo devuelve ~60 días aunque el filtro pida más; meses antiguos quedarán en cero.',
    apiStatusPrefix: 'API:',
    connectorNames: {
      shopify: 'Shopify',
      amazon: 'Amazon',
      mercadolibre: 'Mercado Libre',
      walmart: 'Walmart Marketplace',
    } satisfies Record<ConnectorPlatformId, string>,
    connectorDescriptions: {
      shopify:
        'Sincroniza pedidos y catálogo vía Admin API. Conexión OAuth por tienda.',
      amazon: 'Selling Partner API: pedidos, comisiones y liquidaciones.',
      mercadolibre: 'Publicaciones, pedidos y envíos para marketplaces de Latinoamérica.',
      walmart: 'Pedidos e inventario del marketplace de EE. UU.',
    } satisfies Record<ConnectorPlatformId, string>,
  },
  en: {
    pageEyebrow: 'Workspace',
    pageTitle: 'Connections',
    pageSubtitle:
      'Connect sales channels to sync orders and catalog into analytics. Each integration is managed on its own.',
    sectionConnected: 'Connected',
    sectionAvailable: 'Available',
    loadingStatus: 'Loading connection status…',
    loadError: 'Failed to load connections',
    statusColumn: 'Status',
    statusConnected: 'Connected',
    statusNotConnected: 'Not connected',
    statusNotAvailable: 'Not available',
    lastSyncPrefix: 'Last sync',
    noSyncYet: 'No sync yet',
    activeBadge: 'Active',
    comingSoonBadge: 'Coming soon',
    connect: 'Connect',
    sync: 'Sync',
    syncing: 'Syncing…',
    disconnect: 'Disconnect',
    disconnecting: 'Disconnecting…',
    redirecting: 'Redirecting…',
    advanced: 'Advanced',
    hideOptions: 'Hide options',
    comingSoonButton: 'Coming soon',
    adminsOnly: 'Only workspace admins can connect and sync.',
    syncProgressTitle: 'Syncing data…',
    syncElapsed: 'elapsed',
    syncProgressHint:
      'This can take a few minutes for large stores. You can leave the page when it finishes.',
    lastRunSummary: (catalog: number, orders: number) =>
      `Last run: ${catalog} catalog SKU(s), ${orders} order row(s).`,
    storeDomainLabel: 'Store domain',
    storeDomainPlaceholder: 'your-store or your-store.myshopify.com',
    startDateOptional: 'Start date (optional)',
    endDateOptional: 'End date (optional)',
    backfillLabel:
      'Wide backfill (~2y filter). Without read_all_orders on the OAuth token, Shopify only returns ~60 days of orders; older months stay empty.',
    apiStatusPrefix: 'API:',
    connectorNames: {
      shopify: 'Shopify',
      amazon: 'Amazon',
      mercadolibre: 'Mercado Libre',
      walmart: 'Walmart Marketplace',
    } satisfies Record<ConnectorPlatformId, string>,
    connectorDescriptions: {
      shopify: 'Sync orders and catalog via Admin API. OAuth connection per store.',
      amazon: 'Selling Partner API — orders, fees, and settlement data.',
      mercadolibre: 'Listings, orders, and shipping for Latin America marketplaces.',
      walmart: 'US marketplace orders and inventory feeds.',
    } satisfies Record<ConnectorPlatformId, string>,
  },
} as const

export type ConnectionsStringKey = keyof Omit<
  (typeof CONNECTIONS_STRINGS)['en'],
  'connectorNames' | 'connectorDescriptions' | 'lastRunSummary'
>

export function connectionsT(lang: string, key: ConnectionsStringKey): string {
  const locale = lang === 'en' ? 'en' : 'es'
  return CONNECTIONS_STRINGS[locale][key]
}

export function connectionsConnectorName(lang: string, id: ConnectorPlatformId): string {
  const locale = lang === 'en' ? 'en' : 'es'
  return CONNECTIONS_STRINGS[locale].connectorNames[id]
}

export function connectionsConnectorDescription(lang: string, id: ConnectorPlatformId): string {
  const locale = lang === 'en' ? 'en' : 'es'
  return CONNECTIONS_STRINGS[locale].connectorDescriptions[id]
}

export function connectionsLastRunSummary(
  lang: string,
  catalog: number,
  orders: number,
): string {
  const locale = lang === 'en' ? 'en' : 'es'
  return CONNECTIONS_STRINGS[locale].lastRunSummary(catalog, orders)
}

export function connectorCardCopy(lang: string, id: ConnectorPlatformId): ConnectorCardCopy {
  const locale = lang === 'en' ? 'en' : 'es'
  const t = CONNECTIONS_STRINGS[locale]
  return {
    statusColumn: t.statusColumn,
    statusConnected: t.statusConnected,
    statusNotConnected: t.statusNotConnected,
    statusNotAvailable: t.statusNotAvailable,
    lastSyncPrefix: t.lastSyncPrefix,
    noSyncYet: t.noSyncYet,
    activeBadge: t.activeBadge,
    comingSoonBadge: t.comingSoonBadge,
    connect: t.connect,
    sync: t.sync,
    syncing: t.syncing,
    disconnect: t.disconnect,
    disconnecting: t.disconnecting,
    redirecting: t.redirecting,
    advanced: t.advanced,
    hideOptions: t.hideOptions,
    comingSoonButton: t.comingSoonButton,
    adminsOnly: t.adminsOnly,
    syncProgressTitle: t.syncProgressTitle,
    syncElapsedSuffix: t.syncElapsed,
    syncProgressHint: t.syncProgressHint,
    connectorName: t.connectorNames[id],
    connectorDescription: t.connectorDescriptions[id],
  }
}
