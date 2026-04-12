import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { BarShapeProps } from 'recharts'

type Segment = {
  name: string
  value: number
  isSubtotal: boolean
  isNegative: boolean
}

type WaterfallBar = {
  name: string
  spacer: number
  bar: number
  isSubtotal: boolean
  isNegative: boolean
  rawValue: number
  pctOfGross: number | null
  isLast: boolean
}

type WaterfallLegendLabels = {
  total: string
  deduction: string
  additive: string
  final: string
}

type WaterfallChartProps = {
  segments: Segment[]
  currency: string
  grossRevenue: number
  formatPctOfGross: (pct: number) => string
  finalBarCaption?: string
  legendLabels?: WaterfallLegendLabels
}

type BarLabelProps = {
  x?: number
  y?: number
  width?: number
  value?: number
  isNegative?: boolean
}

type TooltipPayloadItem = {
  payload: WaterfallBar
}

type CustomTooltipProps = {
  active?: boolean
  payload?: TooltipPayloadItem[]
  currency: string
  formatPctOfGross: (pct: number) => string
  finalBarCaption?: string
}

type LegendItem = {
  kind: 'solid' | 'final'
  colorVar: string
  text: string
}

function fmt(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`
  }
  return value.toFixed(0)
}

function buildBars(segments: Segment[], grossRevenue: number): WaterfallBar[] {
  let running = 0
  const rows = segments.map((seg) => {
    if (seg.isSubtotal) {
      const bar: WaterfallBar = {
        name: seg.name,
        spacer: 0,
        bar: seg.value,
        isSubtotal: true,
        isNegative: false,
        rawValue: seg.value,
        pctOfGross: null,
        isLast: false,
      }
      running = seg.value
      return bar
    }
    const abs = Math.abs(seg.value)
    const spacer = seg.isNegative ? running - abs : running
    const bar: WaterfallBar = {
      name: seg.name,
      spacer,
      bar: abs,
      isSubtotal: false,
      isNegative: seg.isNegative,
      rawValue: seg.value,
      pctOfGross: null,
      isLast: false,
    }
    if (seg.isNegative) {
      running -= abs
    } else {
      running += abs
    }
    return bar
  })

  return rows.map((b, i, arr) => {
    const isLast = i === arr.length - 1
    const pctOfGross =
      grossRevenue !== 0 ? (Math.abs(b.rawValue) / Math.abs(grossRevenue)) * 100 : null
    return { ...b, isLast, pctOfGross }
  })
}

function barFillUrl(payload: WaterfallBar): string {
  if (payload.isSubtotal) {
    return payload.isLast ? 'url(#wfFillFinal)' : 'url(#wfFillTotal)'
  }
  if (payload.isNegative) return 'url(#wfFillDed)'
  return 'url(#wfFillAdd)'
}

function WaterfallBarShape(props: BarShapeProps) {
  const payload = props.payload as WaterfallBar | undefined
  const x = props.x ?? 0
  const y = props.y ?? 0
  const w = props.width ?? 0
  const h = props.height ?? 0
  if (payload === undefined || h <= 0 || w <= 0) return null

  const fill = barFillUrl(payload)
  const isFinal = payload.isLast && payload.isSubtotal
  const rx = Math.min(12, w / 2)

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fill}
        rx={rx}
        ry={rx}
        style={{
          filter: isFinal ? 'var(--wf-bar-filter-final)' : 'var(--wf-bar-filter-default)',
        }}
      />
      {isFinal ? (
        <rect
          x={x + 1}
          y={y + 1}
          width={w - 2}
          height={h - 2}
          fill="none"
          stroke="var(--chart-wf-stroke-brand)"
          strokeWidth={2}
          rx={Math.max(0, rx - 1)}
          ry={Math.max(0, rx - 1)}
          style={{ pointerEvents: 'none' }}
        />
      ) : null}
    </g>
  )
}

function BarLabel({ x, y, width, value, isNegative }: BarLabelProps) {
  if (value === undefined || x === undefined || y === undefined || width === undefined) return null
  const cx = x + (width ?? 0) / 2
  const cy = y - 8
  const display = fmt(value)
  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      fontSize={10}
      fill="currentColor"
      className="fill-text-secondary"
    >
      {isNegative && value !== 0 ? `-${display}` : display}
    </text>
  )
}

function CustomTooltip({
  active,
  payload,
  currency,
  formatPctOfGross,
  finalBarCaption,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const sign = d.isNegative && !d.isSubtotal ? '-' : ''
  const val = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(d.rawValue)
  const impact =
    d.pctOfGross !== null && !Number.isNaN(d.pctOfGross)
      ? formatPctOfGross(d.pctOfGross)
      : null
  return (
    <div className="rounded-2xl border border-border-subtle bg-card/95 px-3 py-2 text-xs shadow-[var(--glass-shadow)] backdrop-blur-xl">
      <p className="font-medium text-text-primary">{d.name}</p>
      <p className="mt-0.5 text-text-secondary">
        {sign}
        {val}
      </p>
      {impact ? (
        <p className="mt-1 border-t border-border-subtle pt-1 text-[11px] text-text-tertiary">
          {impact}
        </p>
      ) : null}
      {d.isLast && d.isSubtotal && finalBarCaption ? (
        <p className="mt-1 text-[11px] font-medium text-brand">{finalBarCaption}</p>
      ) : null}
    </div>
  )
}

function WaterfallLegend({ labels }: { labels: WaterfallLegendLabels }) {
  const items: LegendItem[] = [
    { kind: 'solid', colorVar: '--chart-1', text: labels.total },
    { kind: 'solid', colorVar: '--danger', text: labels.deduction },
    { kind: 'solid', colorVar: '--brand', text: labels.additive },
    { kind: 'final', colorVar: '--chart-1', text: labels.final },
  ]
  return (
    <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 border-b border-border-subtle pb-3 text-[11px] text-text-secondary">
      {items.map((item) => (
        <span key={item.text} className="inline-flex items-center gap-2">
          {item.kind === 'final' ? (
            <span
              className="size-3 shrink-0 rounded-sm border-2 border-brand bg-[color:var(--chart-1)] shadow-[inset_0_1px_0_var(--chart-wf-inset-legend),0_0_0_1px_var(--chart-wf-legend-ring)]"
              aria-hidden
            />
          ) : (
            <span
              className="size-2.5 shrink-0 rounded-sm shadow-[inset_0_1px_0_var(--chart-wf-inset-soft)]"
              style={{ backgroundColor: `var(${item.colorVar})` }}
              aria-hidden
            />
          )}
          {item.text}
        </span>
      ))}
    </div>
  )
}

export function WaterfallChart({
  segments,
  currency,
  grossRevenue,
  formatPctOfGross,
  finalBarCaption,
  legendLabels,
}: WaterfallChartProps) {
  const bars = buildBars(segments, grossRevenue)

  return (
    <div className="w-full">
      {legendLabels ? <WaterfallLegend labels={legendLabels} /> : null}

      <div className="relative overflow-hidden rounded-[1.75rem] border border-border-subtle bg-card p-4 shadow-[var(--glass-shadow)] backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-[0.55]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 6px,
              var(--chart-wf-stripe) 6px,
              var(--chart-wf-stripe) 7px
            )`,
          }}
          aria-hidden
        />
        <div className="relative z-[1]">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={bars} margin={{ top: 40, right: 10, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id="wfFillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-wf-zinc-500)" stopOpacity={1} />
                  <stop offset="55%" stopColor="var(--chart-1)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--chart-wf-zinc-950)" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="wfFillFinal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-wf-zinc-500)" stopOpacity={1} />
                  <stop offset="50%" stopColor="var(--chart-1)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--chart-wf-zinc-950)" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="wfFillDed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-wf-danger-light)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--chart-wf-danger-deep)" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="wfFillAdd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-light)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={1} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 6"
                stroke="var(--chart-grid)"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={58}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => fmt(v)}
                width={44}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    currency={currency}
                    formatPctOfGross={formatPctOfGross}
                    finalBarCaption={finalBarCaption}
                  />
                }
                cursor={{ fill: 'var(--chart-wf-cursor-fill)' }}
              />

              <Bar dataKey="spacer" stackId="wf" fill="transparent" />

              <Bar
                dataKey="bar"
                stackId="wf"
                radius={[12, 12, 0, 0]}
                fill="var(--chart-1)"
                shape={WaterfallBarShape}
              >
                <LabelList
                  dataKey="rawValue"
                  content={(props) => {
                    const x = typeof props.x === 'number' ? props.x : Number(props.x)
                    const y = typeof props.y === 'number' ? props.y : Number(props.y)
                    const width =
                      typeof props.width === 'number' ? props.width : Number(props.width)
                    return (
                      <BarLabel
                        x={x}
                        y={y}
                        width={width}
                        value={typeof props.value === 'number' ? props.value : undefined}
                        isNegative={bars[Number(props.index ?? 0)]?.isNegative}
                      />
                    )
                  }}
                />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
