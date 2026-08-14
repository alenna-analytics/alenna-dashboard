import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi } from '@/lib/types/catalog'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { ChannelBadge } from '@/ui/channel-badge'

import { productPlatformLabel } from './product-platform-label'
import { uniqueActivePlatforms } from './product-detail-header-utils'

type ProductDetailPlatformBadgesProps = {
  listings: readonly ProductListingApi[]
  t: (key: ShellStringKey) => string
}

export function ProductDetailPlatformBadges({ listings, t }: ProductDetailPlatformBadgesProps) {
  const platforms = uniqueActivePlatforms(listings)
  if (platforms.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {platforms.map((platform) => {
        const slug = platform.trim().toLowerCase()
        const ui = slug ? INTEGRATION_UI[slug] : undefined
        return (
          <ChannelBadge key={platform} logoSrc={ui?.logoSrc}>
            {productPlatformLabel(platform, t)}
          </ChannelBadge>
        )
      })}
    </div>
  )
}
