import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi } from '@/lib/types/catalog'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'

import { ProductPlatformLogoName } from './product-platform-logo-name'
import { formatListingPublicationSubtitle } from './product-detail-listing-channel-format'
import { SettlementWaterfallList } from './settlement-waterfall-list'

type ProductListingSettlementSheetProps = {
  listing: ProductListingApi | null
  open: boolean
  onOpenChange: (open: boolean) => void
  fmtBase: (value: number) => string
  t: (key: ShellStringKey) => string
  periodLabel: string | null
}

export function ProductListingSettlementSheet({
  listing,
  open,
  onOpenChange,
  fmtBase,
  t,
  periodLabel,
}: ProductListingSettlementSheetProps) {
  const settlement = listing?.period_settlement ?? null
  const publication = listing ? formatListingPublicationSubtitle(listing) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{t('productsDetailListingSettlementBreakdown')}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-6">
          {listing ? (
            <div className="space-y-3 rounded-md border border-border-subtle bg-muted/15 px-4 py-3">
              <ProductPlatformLogoName
                platformSlug={listing.platform}
                t={t}
                className="text-sm font-medium text-text-primary"
              />
              {listing.platform_title ? (
                <p className="text-sm text-text-secondary">{listing.platform_title}</p>
              ) : null}
              <p className="break-all font-mono text-xs text-text-tertiary">{listing.platform_sku}</p>
              {publication ? (
                <p className="text-xs tabular-nums text-text-tertiary">{publication}</p>
              ) : null}
              {periodLabel ? (
                <p className="text-xs text-text-tertiary">{periodLabel}</p>
              ) : null}
            </div>
          ) : null}
          {settlement ? (
            <SettlementWaterfallList settlement={settlement} fmtBase={fmtBase} t={t} />
          ) : (
            <p className="text-sm text-text-secondary">{t('productsDetailListingSettlementEmpty')}</p>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
