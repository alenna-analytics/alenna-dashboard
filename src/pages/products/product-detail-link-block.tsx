import { Link } from 'react-router-dom'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { ChannelBadge } from '@/ui/channel-badge'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'

import { productPlatformLabel } from './product-platform-label'

type ProductDetailLinkBlockProps = {
  detail: ProductDetailApi
  t: (key: ShellStringKey) => string
  fmtMoney: (value: number) => string
}

export function ProductDetailLinkBlock({ detail, t, fmtMoney }: ProductDetailLinkBlockProps) {
  if (!detail.link_group_id) return null
  const siblings = detail.link_siblings ?? []
  return (
    <div className="rounded-md border border-border-subtle bg-muted/20 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-text-primary">{t('productsVinculacionTambienEn')}</p>
        <Link
          to={`/dashboard/products/vinculacion/${detail.link_group_id}`}
          className="text-sm text-primary hover:underline"
        >
          {t('productsVinculacionViewGroup')}
        </Link>
      </div>
      {siblings.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {siblings.map((sibling) => {
            const slug = sibling.platform.trim().toLowerCase()
            const ui = slug ? INTEGRATION_UI[slug] : undefined
            return (
              <Link key={sibling.product_id} to={`/dashboard/products/${sibling.product_id}`}>
                <ChannelBadge logoSrc={ui?.logoSrc}>
                  {productPlatformLabel(sibling.platform, t)}
                </ChannelBadge>
              </Link>
            )
          })}
        </div>
      ) : null}
      <div className="mt-3 grid gap-2 text-xs text-text-secondary sm:grid-cols-2">
        <p>
          {t('productsVinculacionGroupKpis')}: {detail.link_group_net_units_sold ?? 0} ·{' '}
          {fmtMoney(detail.link_group_net_sales ?? 0)}
        </p>
        <p>
          {t('productsVinculacionChannelKpis')}: {detail.period_net_units_sold} ·{' '}
          {fmtMoney(detail.period_net_sales)}
        </p>
      </div>
    </div>
  )
}
