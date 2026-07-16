import { useMemo } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  type ChannelPlatform,
  type PlatformMetrics,
} from '@/pages/channels/channels-platform-aggregate'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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
  { key: 'ads', color: 'var(--chart-5)', labelKey: 'reportsWfAdsSpend' as const },
  {
    key: 'cm',
    color: 'var(--chart-1)',
    labelKey: 'reportsWfContributionMargin' as const,
  },
] as const

type ChannelsCostStructureChartProps = {
  metrics: Record<string, PlatformMetrics>
  platforms: ChannelPlatform[]
  t: (key: ShellStringKey) => string
}

type ChartRow = {
  label: string
  cogs: number
  fees: number
  shipping: number
  ads: number
  cm: number
}

type TooltipItem = {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
}

function CostTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean
  label?: string | number
  payload?: readonly TooltipItem[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border-default bg-background px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
      {label != null ? (
        <div className="mb-1.5 font-medium text-text-primary">{String(label)}</div>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const n = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0)
          return (
            <div
              key={`${String(entry.dataKey)}-${i}`}
              className="flex flex-wrap items-baseline gap-x-2 tabular-nums"
            >
              <span className="inline-flex items-center gap-1.5 text-text-secondary">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: entry.color }}
                  aria-hidden
                />
                {entry.name}:
              </span>
              <span className="font-medium text-text-primary">{n.toFixed(1)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function toPctParts(m: PlatformMetrics): Omit<ChartRow, 'label'> | null {
  const vn = m.net_revenue
  if (vn === 0) return null
  const cogs = (m.cogs / vn) * 100
  const fees = (m.platform_fees_total / vn) * 100
  const shipping = (m.merchant_shipping_cost / vn) * 100
  const ads = 0
  const cm = (m.contribution_margin / vn) * 100
  return { cogs, fees, shipping, ads, cm }
}

export function ChannelsCostStructureChart({
  metrics,
  platforms,
  t,
}: ChannelsCostStructureChartProps) {
  const data = useMemo((): ChartRow[] => {
    const out: ChartRow[] = []
    for (const platform of platforms) {
      const parts = toPctParts(metrics[platform.slug])
      if (!parts) continue
      out.push({ label: platform.label, ...parts })
    }
    return out
  }, [metrics, platforms])

  if (data.length === 0) {
    return (
      <p className="rounded-md px-2 py-6 text-sm text-text-secondary">{t('reportsNoData')}</p>
    )
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
            width={48}
          />
          <Tooltip content={<CostTooltip />} />
          <Legend />
          {SEGMENTS.map((seg) => (
            <Bar
              key={seg.key}
              dataKey={seg.key}
              name={t(seg.labelKey)}
              stackId="cost"
              fill={seg.color}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
