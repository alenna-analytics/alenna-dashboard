import { useMemo } from 'react'

import { useChartLineLoadAnimation } from '@/pages/dashboard/use-chart-line-load-animation'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ChannelBreakdownRow } from '@/lib/types/reports'

const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]
const OVERFLOW_COLOR = 'var(--text-tertiary, #9aa0a6)'
const TOP_N = 5
const PIE_LOAD_MS = 1000

export type HomeChannelDonutChartProps = {
  rows: ChannelBreakdownRow[]
  /** Convert a base-currency amount to display currency. */
  convertValue: (value: number) => number
  /** Format a value (already in display currency) for tooltips/center label. */
  formatValue: (value: number) => string
  t: (key: ShellStringKey) => string
  /** Match adjacent chart height (e.g. top products column). */
  minBodyHeightPx?: number
}

type Slice = {
  key: string
  label: string
  value: number
  fill: string
  isOverflow: boolean
}

function platformLabel(platform: string): string {
  if (!platform) return ''
  return platform[0].toUpperCase() + platform.slice(1)
}

function rowLabel(row: ChannelBreakdownRow): string {
  return platformLabel(row.platform) || row.connection_id
}

/**
 * Donut showing each channel's share of gross revenue for the period.
 *
 * Visibility rules baked in:
 * - Top 5 channels rendered as separate slices.
 * - Anything beyond the top 5 collapses into one neutral "Other" slice
 *   so the legend stays scannable when a tenant has many connections.
 * - Center label shows the total gross revenue (display currency).
 *
 * The chart is intentionally render-only: data, sorting, and currency
 * conversion happen in the page so loading and error states are handled
 * once at the call site rather than scattered across each chart.
 */
export function HomeChannelDonutChart({
  rows,
  convertValue,
  formatValue,
  t,
  minBodyHeightPx,
}: HomeChannelDonutChartProps) {
  const slices = useMemo<Slice[]>(() => {
    const sorted = [...rows].sort((a, b) => b.gross_revenue - a.gross_revenue)
    const head = sorted.slice(0, TOP_N).map((r, i) => ({
      key: r.connection_id,
      label: rowLabel(r),
      value: convertValue(r.gross_revenue),
      fill: PALETTE[i % PALETTE.length],
      isOverflow: false,
    }))
    const tail = sorted.slice(TOP_N)
    if (tail.length > 0) {
      const tailTotal = tail.reduce(
        (acc, r) => acc + convertValue(r.gross_revenue),
        0,
      )
      head.push({
        key: '__overflow__',
        label: t('homeChannelDonutOther'),
        value: tailTotal,
        fill: OVERFLOW_COLOR,
        isOverflow: true,
      })
    }
    return head.filter((s) => s.value > 0)
  }, [rows, convertValue, t])

  const pieAnimKey = useMemo(
    () => slices.map((s) => `${s.key}:${s.value.toFixed(4)}`).join('|'),
    [slices],
  )
  const pieLoadAnim = useChartLineLoadAnimation(pieAnimKey, PIE_LOAD_MS)

  const total = useMemo(
    () => slices.reduce((acc, s) => acc + s.value, 0),
    [slices],
  )

  if (slices.length === 0 || total === 0) {
    return (
      <p className="rounded-md px-2 py-10 text-center text-sm text-text-secondary">
        {t('homeChannelDonutEmpty')}
      </p>
    )
  }

  return (
    <div
      className="flex w-full flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:justify-between"
      style={minBodyHeightPx ? { minHeight: minBodyHeightPx } : undefined}
    >
      <div className="relative h-64 w-full lg:w-1/2">
        <div
          className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center"
          aria-hidden
        >
          <span className="text-xs font-medium text-text-secondary">
            {t('homeChannelDonutCenterLabel')}
          </span>
          <span className="text-lg font-semibold tracking-tight text-text-primary">
            {formatValue(total)}
          </span>
        </div>
        <div className="relative z-[5] h-full min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                innerRadius="60%"
                outerRadius="90%"
                stroke="var(--bg-default, #fff)"
                strokeWidth={2}
                paddingAngle={1}
                isAnimationActive={pieLoadAnim}
                animationDuration={PIE_LOAD_MS}
                animationEasing="ease-out"
              >
                {slices.map((s) => (
                  <Cell key={s.key} fill={s.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const n =
                    value == null ? 0 : typeof value === 'number' ? value : Number(value)
                  return [
                    formatValue(Number.isFinite(n) ? n : 0),
                    String(name ?? ''),
                  ]
                }}
                wrapperStyle={{ zIndex: 30 }}
                contentStyle={{
                  background: 'var(--bg-default, #fff)',
                  border: '1px solid var(--shell-structure-border)',
                  borderRadius: 6,
                  fontSize: 12,
                  position: 'relative',
                  zIndex: 30,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-2 text-sm">
        {slices.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ background: s.fill }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-text-primary">
                {s.label}
              </span>
              <span className="shrink-0 text-text-secondary tabular-nums">
                {pct.toFixed(1)}%
              </span>
              <span className="shrink-0 text-text-primary tabular-nums">
                {formatValue(s.value)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
