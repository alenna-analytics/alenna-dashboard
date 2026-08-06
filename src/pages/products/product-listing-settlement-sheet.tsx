import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi } from '@/lib/types/catalog'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'

import { ProductPlatformLogoName } from './product-platform-logo-name'
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{t('productsDetailListingSettlementBreakdown')}</SheetTitle>
          {listing ? (
            <SheetDescription className="space-y-1">
              <span className="block">
                <ProductPlatformLogoName
                  platformSlug={listing.platform}
                  t={t}
                  className="text-sm text-text-secondary"
                />
              </span>
              <span className="block font-mono text-xs text-text-tertiary">{listing.platform_sku}</span>
              {periodLabel ? (
                <span className="block text-xs text-text-tertiary">{periodLabel}</span>
              ) : null}
            </SheetDescription>
          ) : null}
        </SheetHeader>
        <SheetBody>
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
