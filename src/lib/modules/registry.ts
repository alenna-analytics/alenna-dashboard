import {
  FileBarChart,
  Link2,
  Megaphone,
  Receipt,
  Sparkles,
  Store,
  Tag,
} from 'lucide-react'

import type { ModuleDefinition } from '@/lib/modules/types'

export const MODULES: readonly ModuleDefinition[] = [
  {
    id: 'products',
    labelKey: 'navProductCatalog',
    path: '/dashboard/products',
    icon: Tag,
    comingSoon: false,
    section: 'analytics',
  },
  {
    id: 'sales',
    labelKey: 'navSales',
    path: '/dashboard/sales',
    icon: Receipt,
    comingSoon: true,
    section: 'analytics',
  },
  {
    id: 'reports',
    labelKey: 'navReports',
    path: '/dashboard/reports',
    icon: FileBarChart,
    comingSoon: false,
    section: 'analytics',
  },
  {
    id: 'ads',
    labelKey: 'navAds',
    path: '/dashboard/ads',
    icon: Megaphone,
    comingSoon: true,
    section: 'analytics',
  },
  {
    id: 'channels',
    labelKey: 'navChannels',
    path: '/dashboard/channels',
    icon: Store,
    comingSoon: true,
    section: 'analytics',
  },
  {
    id: 'simulations',
    labelKey: 'navSimulations',
    path: '/dashboard/simulations',
    icon: Sparkles,
    comingSoon: true,
    section: 'analytics',
  },
  {
    id: 'integrations',
    labelKey: 'navIntegrations',
    path: '/dashboard/integrations',
    icon: Link2,
    comingSoon: false,
    section: 'config',
  },
] as const
