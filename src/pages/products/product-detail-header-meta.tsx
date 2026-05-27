import { AlertTriangle } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { cn } from '@/lib/utils'

const MAX_ALERT_CHANNELS = 3

type ProductDetailHeaderMetaProps = {
  detail: ProductDetailApi
  t: (key: ShellStringKey) => string
}

function platformLabel(platform: string, t: (key: ShellStringKey) => string): string {
  const slug = platform.trim().toLowerCase()
  const ui = slug ? INTEGRATION_UI[slug] : undefined
  return ui?.nameKey != null ? t(ui.nameKey) : platform
}

export function ProductDetailHeaderMeta({ detail, t }: ProductDetailHeaderMetaProps) {
  const activeListings = detail.listings.filter((l) => l.active)
  const alerts = detail.stock_alert_summary

  const scrollToChannels = () => {
    document.getElementById('product-channels-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const alertPlatforms = alerts.slice(0, MAX_ALERT_CHANNELS).map((a) => platformLabel(a.platform, t))
  const moreAlerts = alerts.length - alertPlatforms.length

  return (
    <div className="space-y-2">
      {activeListings.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeListings.map((listing) => {
            const slug = listing.platform.trim().toLowerCase()
            const ui = slug ? INTEGRATION_UI[slug] : undefined
            return (
              <Badge
                key={listing.id}
                variant="secondary"
                className="gap-1.5 px-2 py-0.5 text-[11px] font-medium"
              >
                {ui?.logoSrc != null ? (
                  <img src={ui.logoSrc} alt="" className="size-3.5 object-contain" aria-hidden />
                ) : null}
                <span>{platformLabel(listing.platform, t)}</span>
              </Badge>
            )
          })}
        </div>
      ) : null}

      {alerts.length > 0 ? (
        <div
          className={cn(
            'flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-xs',
            alerts.some((a) => a.stock_alert === 'out')
              ? 'border-destructive/30 bg-destructive/5 text-destructive'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100',
          )}
        >
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 leading-snug">
            {alerts.some((a) => a.stock_alert === 'out')
              ? t('productsDetailStockAlertOut')
              : t('productsDetailStockAlertLow')}
            {': '}
            {alertPlatforms.join(', ')}
            {moreAlerts > 0
              ? ` ${t('productsDetailStockAlertMore').replace('{count}', String(moreAlerts))}`
              : ''}
          </span>
          <Button type="button" variant="ghost" size="xs" className="h-7 shrink-0 px-2" onClick={scrollToChannels}>
            {t('productsDetailViewChannelsTable')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
