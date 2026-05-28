import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi } from '@/lib/types/catalog'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { Badge } from '@/ui/badge'
import { cn } from '@/lib/utils'

import { productPlatformLabel } from './product-platform-label'
import { uniqueActivePlatforms } from './product-detail-header-utils'

/** 28px pills — same height as header sync / filter pills (`h-7`). */
export const productDetailChannelPillClassName = cn(
  'h-7 min-h-7 max-h-7 box-border gap-1.5 border-border-default bg-[var(--platinum-blonde-300)] py-0 leading-none shadow-none',
)

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
          <Badge key={platform} variant="outline" className={productDetailChannelPillClassName}>
            {ui?.logoSrc != null ? (
              <img src={ui.logoSrc} alt="" className="size-4 shrink-0 object-contain" aria-hidden />
            ) : null}
            <span>{productPlatformLabel(platform, t)}</span>
          </Badge>
        )
      })}
    </div>
  )
}
