export type ConnectorPlatformId = 'shopify' | 'amazon' | 'mercadolibre' | 'walmart'

export type ConnectorAccent = 'shopify' | 'amazon' | 'mercadolibre' | 'walmart'

export type ConnectorDefinition = {
  id: ConnectorPlatformId
  accent: ConnectorAccent
  /** OAuth / API wiring exists in the app */
  implemented: boolean
}

export const CONNECTOR_DEFINITIONS: ConnectorDefinition[] = [
  {
    id: 'shopify',
    accent: 'shopify',
    implemented: true,
  },
  {
    id: 'amazon',
    accent: 'amazon',
    implemented: false,
  },
  {
    id: 'mercadolibre',
    accent: 'mercadolibre',
    implemented: false,
  },
  {
    id: 'walmart',
    accent: 'walmart',
    implemented: false,
  },
]

export const ACCENT_STYLES: Record<
  ConnectorAccent,
  { border: string; logoBg: string; ring: string; subtle: string }
> = {
  shopify: {
    border: 'border-l-emerald-500',
    logoBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    ring: 'ring-emerald-500/20',
    subtle: 'bg-emerald-500/5',
  },
  amazon: {
    border: 'border-l-orange-500',
    logoBg: 'bg-orange-500/15 text-orange-800 dark:text-orange-300',
    ring: 'ring-orange-500/20',
    subtle: 'bg-orange-500/5',
  },
  mercadolibre: {
    border: 'border-l-amber-400',
    logoBg: 'bg-amber-400/20 text-amber-900 dark:text-amber-200',
    ring: 'ring-amber-400/25',
    subtle: 'bg-amber-400/8',
  },
  walmart: {
    border: 'border-l-blue-600',
    logoBg: 'bg-blue-600/15 text-blue-800 dark:text-blue-300',
    ring: 'ring-blue-500/20',
    subtle: 'bg-blue-600/5',
  },
}
