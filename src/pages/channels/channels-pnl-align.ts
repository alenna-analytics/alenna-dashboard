import type { PlatformAdsRollup } from '@/pages/channels/channels-ads-by-platform'
import type {
  PlatformMetrics,
  PlatformSettlementMetrics,
} from '@/pages/channels/channels-platform-aggregate'

const NEAR_ZERO = 0.5

function finish(metric: PlatformMetrics): PlatformMetrics {
  const aov = metric.order_count > 0 ? metric.net_revenue / metric.order_count : 0
  const contribution_margin_pct =
    metric.net_revenue !== 0 ? (metric.contribution_margin / metric.net_revenue) * 100 : 0
  return { ...metric, aov, contribution_margin_pct }
}

/**
 * Put settlement shipping on the P&L when the KPI row left it at zero, and
 * attribute ads to the matching channel. Ads that still have no channel are
 * spread by net sales so the total equals the sum of the columns.
 */
export function alignChannelPnl(input: {
  metrics: Record<string, PlatformMetrics>
  settlement: Record<string, PlatformSettlementMetrics>
  adsByPlatform: Record<string, PlatformAdsRollup>
  tenantAdsSpend: number
}): { metrics: Record<string, PlatformMetrics>; unlinkedAds: number } {
  const metrics: Record<string, PlatformMetrics> = {}
  let linkedAds = 0

  for (const [slug, metric] of Object.entries(input.metrics)) {
    if (slug === 'total') continue
    const settlementShipping = input.settlement[slug]?.shipping_charges ?? 0
    const shipping =
      Math.abs(metric.merchant_shipping_cost) < NEAR_ZERO && settlementShipping >= NEAR_ZERO
        ? settlementShipping
        : metric.merchant_shipping_cost
    const rollup = input.adsByPlatform[slug]
    const ads = rollup ? rollup.linkedSpend : metric.ads_spend
    const shippingChange = shipping - metric.merchant_shipping_cost
    const adsChange = ads - metric.ads_spend
    linkedAds += ads
    metrics[slug] = finish({
      ...metric,
      merchant_shipping_cost: shipping,
      ads_spend: ads,
      contribution_margin: metric.contribution_margin - shippingChange - adsChange,
    })
  }

  const total = input.metrics.total
  const unlinkedAds = Math.max(0, input.tenantAdsSpend - linkedAds)
  const netSum = Object.values(metrics).reduce(
    (sum, metric) => sum + Math.max(0, metric.net_revenue),
    0,
  )
  if (unlinkedAds > 0 && netSum > 0) {
    for (const [slug, metric] of Object.entries(metrics)) {
      const share = Math.max(0, metric.net_revenue) / netSum
      const extra = unlinkedAds * share
      metrics[slug] = finish({
        ...metric,
        ads_spend: metric.ads_spend + extra,
        contribution_margin: metric.contribution_margin - extra,
      })
    }
  }
  if (total) {
    const channels = Object.values(metrics)
    metrics.total = finish({
      ...total,
      merchant_shipping_cost: channels.reduce(
        (sum, metric) => sum + metric.merchant_shipping_cost,
        0,
      ),
      ads_spend: channels.reduce((sum, metric) => sum + metric.ads_spend, 0),
      contribution_margin: channels.reduce(
        (sum, metric) => sum + metric.contribution_margin,
        0,
      ),
    })
  }

  return { metrics, unlinkedAds: 0 }
}
