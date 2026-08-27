import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { pageTitleClassName } from '@/shell/layout/dashboard-page'

import { ProductDetailHeaderStats } from './product-detail-header-stats'
import { ProductDetailPlatformBadges } from './product-detail-platform-badges'
import { ProductDetailStockAlert } from './product-detail-stock-alert'

type ProductDetailHeaderThumbProps = {
  url: string | null
  title: string
  className?: string
}

type ProductDetailHeaderProps = {
  detail: ProductDetailApi
  productId: string
  t: (key: ShellStringKey) => string
  lang: string
  thumb: React.ReactNode
  skuDraft: string
  onSkuDraftChange?: (value: string) => void
}

export function ProductDetailHeader({
  detail,
  productId,
  t,
  lang,
  thumb,
  skuDraft,
  onSkuDraftChange,
}: ProductDetailHeaderProps) {
  const displayTitle = detail.variant_label ?? detail.title

  return (
    <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:gap-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-1 sm:gap-0 sm:space-y-3">
          <div className="shrink-0 sm:hidden">{thumb}</div>
          <div className="min-w-0 space-y-3">
            <h1 className={pageTitleClassName}>{displayTitle}</h1>

            <ProductDetailPlatformBadges listings={detail.listings} t={t} />

            <div className="hidden sm:block">
              <ProductDetailHeaderStats
                detail={detail}
                t={t}
                lang={lang}
                skuDraft={skuDraft}
                onSkuDraftChange={onSkuDraftChange}
              />
            </div>

            {detail.brand ? <p className="text-sm text-text-secondary">{detail.brand}</p> : null}
          </div>
        </div>
        <div className="hidden shrink-0 sm:block">{thumb}</div>
      </div>

      <div className="sm:hidden">
        <ProductDetailHeaderStats
          detail={detail}
          t={t}
          lang={lang}
          skuDraft={skuDraft}
          onSkuDraftChange={onSkuDraftChange}
        />
      </div>

      <ProductDetailStockAlert detail={detail} productId={productId} t={t} />
    </div>
  )
}

export type { ProductDetailHeaderThumbProps }
