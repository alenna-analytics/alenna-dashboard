import { Link } from 'react-router-dom'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { pageTitleClassName } from '@/shell/layout/dashboard-page'

import { ProductDetailHeaderStats } from './product-detail-header-stats'
import { ProductDetailPlatformBadges } from './product-detail-platform-badges'
import { ProductDetailStockAlert } from './product-detail-stock-alert'

type ProductDetailHeaderThumbProps = {
  url: string | null
  title: string
}

type ProductDetailHeaderProps = {
  detail: ProductDetailApi
  t: (key: ShellStringKey) => string
  lang: string
  thumb: React.ReactNode
  skuDraft: string
  onSkuDraftChange: (value: string) => void
}

export function ProductDetailHeader({
  detail,
  t,
  lang,
  thumb,
  skuDraft,
  onSkuDraftChange,
}: ProductDetailHeaderProps) {
  const displayTitle = detail.variant_label ?? detail.title

  return (
    <div className="flex min-w-0 items-start justify-between gap-6 border-b border-border-subtle pb-6">
      <div className="min-w-0 flex-1 space-y-3">
        <h1 className={pageTitleClassName}>{displayTitle}</h1>

        {detail.parent_product_id ? (
          <Link
            to={`/dashboard/products/${detail.parent_product_id}`}
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            {t('productsDetailParentLink')}
          </Link>
        ) : null}

        <ProductDetailPlatformBadges listings={detail.listings} t={t} />

        <ProductDetailHeaderStats
          detail={detail}
          t={t}
          lang={lang}
          skuDraft={skuDraft}
          onSkuDraftChange={onSkuDraftChange}
        />

        <ProductDetailStockAlert detail={detail} t={t} />

        {detail.brand ? <p className="text-sm text-text-secondary">{detail.brand}</p> : null}
      </div>
      {thumb}
    </div>
  )
}

export type { ProductDetailHeaderThumbProps }
