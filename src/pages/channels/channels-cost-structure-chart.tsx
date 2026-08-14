import { useMemo } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  type ChannelPlatform,
  type PlatformMetrics,
} from '@/pages/channels/channels-platform-aggregate'

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
  segments: ChartSegment[]
}

function toPct(value: number, netRevenue: number): number {
  if (netRevenue === 0) return 0
  return (value / netRevenue) * 100
}

function buildRow(label: string, m: PlatformMetrics, t: (key: ShellStringKey) => string): ChartRow | null {
  if (m.net_revenue === 0) return null
  const values: Record<CostSegmentKey, number> = {
    cogs: toPct(m.cogs, m.net_revenue),
    fees: toPct(m.platform_fees_total, m.net_revenue),
    shipping: toPct(m.merchant_shipping_cost, m.net_revenue),
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
  return { label, segments }
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
    for (const platform of platforms) {
      const row = buildRow(platform.label, metrics[platform.slug], t)
      if (row) out.push(row)
    }
    const totalRow = buildRow(t('channelsColTotal'), metrics.total, t)
    if (totalRow) out.push(totalRow)
    return out
  }, [metrics, platforms, t])

  if (data.length === 0) {
    return (
      <p className="rounded-md px-2 py-6 text-sm text-text-secondary">{t('reportsNoData')}</p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-5">
        {data.map((row) => {
          const stackTotal = row.segments.reduce((sum, seg) => sum + seg.pct, 0)
          return (
            <li key={row.label} className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text-primary">{row.label}</p>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/55">
                {row.segments.map((seg) => (
                  <div
                    key={seg.key}
                    className="h-full min-w-0"
                    style={{
                      width: `${stackTotal > 0 ? (seg.pct / stackTotal) * 100 : 0}%`,
                      background: seg.color,
                    }}
                    title={`${seg.label}: ${formatPct(seg.pct)}`}
                  />
                ))}
              </div>
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {row.segments.map((seg) => (
                  <li
                    key={`${row.label}-${seg.key}`}
                    className="inline-flex items-center gap-1.5 text-xs tabular-nums text-text-secondary"
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: seg.color }}
                      aria-hidden
                    />
                    {seg.label} {formatPct(seg.pct)}
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
