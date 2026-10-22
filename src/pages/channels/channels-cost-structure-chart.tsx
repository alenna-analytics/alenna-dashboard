import { useMemo, useState } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  type ChannelPlatform,
  type PlatformMetrics,
} from '@/pages/channels/channels-platform-aggregate'
import {
  ChartTooltipFrame,
  ChartTooltipSeriesRow,
  ChartTooltipTitle,
} from '@/ui/chart-tooltip'

const SEGMENTS = [
  { key: 'cogs', color: 'var(--chart-2)', labelKey: 'reportsWfCogs' as const },
  {
    key: 'fees',
    color: 'var(--chart-3)',
    labelKey: 'reportsKpiPlatformFees' as const,
  },
  {
    key: 'shipping',
    color: 'var(--chart-4)',
    labelKey: 'reportsKpiFulfillmentCost' as const,
  },
  {
    key: 'ads',
    color: '#8b7cb8',
    labelKey: 'channelsAdsSegment' as const,
  },
  {
    key: 'cm',
    color: 'var(--chart-1)',
    labelKey: 'reportsWfContributionMargin' as const,
  },
] as const

type CostSegmentKey = (typeof SEGMENTS)[number]['key']

type ChannelsCostStructureChartProps = {
  metrics: Record<string, PlatformMetrics>
  platforms: ChannelPlatform[]
  t: (key: ShellStringKey) => string
}

type ChartSegment = {
  key: CostSegmentKey
  color: string
  label: string
  pct: number
}

type ChartRow = {
  label: string
  missingCogs: boolean
  segments: ChartSegment[]
}

function cogsMissing(metric: PlatformMetrics | undefined): boolean {
  if (!metric) return false
  return metric.net_revenue > 0.5 && Math.abs(metric.cogs) < 0.5
}

function toPct(value: number, netRevenue: number): number {
  if (netRevenue === 0) return 0
  return (value / netRevenue) * 100
}

function buildRow(
  label: string,
  m: PlatformMetrics,
  t: (key: ShellStringKey) => string,
  missingCogs: boolean,
): ChartRow | null {
  if (m.net_revenue === 0) return null
  const values: Record<CostSegmentKey, number> = {
    cogs: toPct(m.cogs, m.net_revenue),
    fees: toPct(m.platform_fees_total, m.net_revenue),
    shipping: toPct(m.merchant_shipping_cost, m.net_revenue),
    ads: toPct(m.ads_spend, m.net_revenue),
    cm: toPct(m.contribution_margin, m.net_revenue),
  }
  const segments = SEGMENTS.flatMap((seg) => {
    const pct = values[seg.key]
    if (pct <= 0.05) return []
    return [
      {
        key: seg.key,
        color: seg.color,
        label: t(seg.labelKey),
        pct,
      },
    ]
  })
  if (segments.length === 0) return null
  return { label, missingCogs, segments }
}

function formatPct(pct: number): string {
  return `${pct.toFixed(pct >= 10 ? 0 : 1)}%`
}

export function ChannelsCostStructureChart({
  metrics,
  platforms,
  t,
}: ChannelsCostStructureChartProps) {
  const data = useMemo((): ChartRow[] => {
    const out: ChartRow[] = []
    const anyMissing = platforms.some((platform) => cogsMissing(metrics[platform.slug]))
    for (const platform of platforms) {
      const metric = metrics[platform.slug]
      if (!metric) continue
      const row = buildRow(platform.label, metric, t, cogsMissing(metric))
      if (row) out.push(row)
    }
    const total = metrics.total
    const totalRow = total ? buildRow(t('channelsColTotal'), total, t, anyMissing) : null
    if (totalRow) out.push(totalRow)
    return out
  }, [metrics, platforms, t])

  const [hover, setHover] = useState<{
    rowLabel: string
    segment: ChartSegment
    x: number
    y: number
  } | null>(null)

  if (data.length === 0) {
    return (
      <p className="rounded-md px-2 py-6 text-sm text-text-secondary">{t('reportsNoData')}</p>
    )
  }

  const legend = SEGMENTS.map((segment) => ({
    key: segment.key,
    color: segment.color,
    label: t(segment.labelKey),
  }))

  return (
    <div className="relative flex flex-col gap-6">
      <ul className="flex flex-col gap-4">
        {data.map((row) => {
          const stackTotal = row.segments.reduce((sum, seg) => sum + seg.pct, 0)
          return (
            <li key={row.label} className="grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-3">
              <p className="truncate text-sm font-medium text-text-primary">
                {row.label}
                {row.missingCogs ? ' *' : ''}
              </p>
              <div className="flex h-8 w-full overflow-hidden rounded-md bg-muted/55">
                {row.segments.map((seg) => {
                  const width = stackTotal > 0 ? (seg.pct / stackTotal) * 100 : 0
                  return (
                    <div
                      key={seg.key}
                      className="flex h-full min-w-0 cursor-default items-center justify-center overflow-hidden"
                      style={{ width: `${width}%`, background: seg.color }}
                      onMouseEnter={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect()
                        setHover({
                          rowLabel: row.label,
                          segment: seg,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        })
                      }}
                      onMouseLeave={() => setHover(null)}
                    >
                      {width >= 12 ? (
                        <span className="px-1 text-[11px] font-medium tabular-nums text-white">
                          {formatPct(seg.pct)}
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {legend.map((item) => (
          <li
            key={item.key}
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary"
          >
            <span className="size-2 shrink-0 rounded-sm" style={{ background: item.color }} aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>
      {hover ? (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[calc(100%+12px)]"
          style={{ left: hover.x, top: hover.y }}
        >
          <ChartTooltipFrame portal={false}>
            <ChartTooltipTitle>{hover.rowLabel}</ChartTooltipTitle>
            <ChartTooltipSeriesRow
              color={hover.segment.color}
              label={hover.segment.label}
              value={formatPct(hover.segment.pct)}
            />
          </ChartTooltipFrame>
        </div>
      ) : null}
    </div>
  )
}
