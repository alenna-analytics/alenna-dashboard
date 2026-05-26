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
    id: 'reports',
    labelKey: 'navReports',
    path: '/dashboard',
    icon: FileBarChart,
    comingSoon: false,
    section: 'main',
  },
  {
    id: 'products',
    labelKey: 'navProductCatalog',
    path: '/dashboard/products',
    icon: Tag,
    comingSoon: false,
    section: 'main',
  },
  {
    id: 'sales',
    labelKey: 'navSales',
    path: '/dashboard/sales',
    icon: Receipt,
    comingSoon: true,
    section: 'main',
  },
  {
    id: 'ads',
    labelKey: 'navAds',
    path: '/dashboard/ads',
    icon: Megaphone,
    comingSoon: true,
    section: 'main',
  },
  {
    id: 'simulations',
    labelKey: 'navSimulations',
    path: '/dashboard/simulations',
    icon: Sparkles,
    comingSoon: true,
    section: 'main',
  },
  {
    id: 'channels',
    labelKey: 'navChannels',
    path: '/dashboard/channels',
    icon: Store,
    comingSoon: true,
    section: 'configuration',
  },
  {
    id: 'integrations',
    labelKey: 'navIntegrations',
    path: '/dashboard/integrations',
    icon: Link2,
    comingSoon: false,
    section: 'configuration',
  },
] as const
