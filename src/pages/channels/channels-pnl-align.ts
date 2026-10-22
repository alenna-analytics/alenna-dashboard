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
 * attribute linked ads to the matching channel. The total subtracts that
 * spend plus any ads that still have no channel.
 */
export function alignChannelPnl(input: {
  metrics: Record<string, PlatformMetrics>
  settlement: Record<string, PlatformSettlementMetrics>
  adsByPlatform: Record<string, PlatformAdsRollup>
  tenantAdsSpend: number
}): { metrics: Record<string, PlatformMetrics>; unlinkedAds: number } {
  const metrics: Record<string, PlatformMetrics> = {}
  let shippingDelta = 0
  let adsDelta = 0
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
    shippingDelta += shippingChange
    adsDelta += adsChange
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
  if (total) {
    metrics.total = finish({
      ...total,
      merchant_shipping_cost: total.merchant_shipping_cost + shippingDelta,
      ads_spend: total.ads_spend + adsDelta + unlinkedAds,
      contribution_margin:
        total.contribution_margin - shippingDelta - adsDelta - unlinkedAds,
    })
  }

  return { metrics, unlinkedAds }
}
