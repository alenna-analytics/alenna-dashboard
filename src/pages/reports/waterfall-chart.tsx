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


const COLOR_TOTAL = '#2d3a40'
const COLOR_TOTAL_FINAL = '#0d9488'
const COLOR_DEDUCTION = '#dc2626'
const COLOR_POSITIVE = '#059669'

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

function barFill(payload: WaterfallBar): string {
  if (payload.isSubtotal) {
    return payload.isLast ? COLOR_TOTAL_FINAL : COLOR_TOTAL
  }
  if (payload.isNegative) return COLOR_DEDUCTION
  return COLOR_POSITIVE
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
    <div className="rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-xs shadow-sm">
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
        <p className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          {finalBarCaption}
        </p>
      ) : null}
    </div>
  )
}

function WaterfallLegend({ labels }: { labels: WaterfallLegendLabels }) {
  const items: Array<{ color: string; text: string }> = [
    { color: COLOR_TOTAL, text: labels.total },
    { color: COLOR_DEDUCTION, text: labels.deduction },
    { color: COLOR_POSITIVE, text: labels.additive },
    { color: COLOR_TOTAL_FINAL, text: labels.final },
  ]
  return (
    <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 border-b border-border-subtle pb-3 text-[11px] text-text-secondary">
      {items.map((item) => (
        <span key={item.text} className="inline-flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
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
      <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={bars} margin={{ top: 36, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="var(--color-border-subtle)"
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-28}
          textAnchor="end"
          height={56}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => fmt(v)}
          width={48}
        />
        <Tooltip
          content={
            <CustomTooltip
              currency={currency}
              formatPctOfGross={formatPctOfGross}
              finalBarCaption={finalBarCaption}
            />
          }
          cursor={{ fill: 'var(--color-bg-overlay)' }}
        />

        <Bar dataKey="spacer" stackId="wf" fill="transparent" />

        <Bar
          dataKey="bar"
          stackId="wf"
          radius={[3, 3, 0, 0]}
          fill={COLOR_TOTAL}
          shape={(props: BarShapeProps) => {
            const payload = props.payload as WaterfallBar | undefined
            if (payload === undefined) return null
            const color = barFill(payload)
            const stroke =
              payload.isLast && payload.isSubtotal ? 'rgba(13,148,136,0.45)' : 'transparent'
            const strokeW = payload.isLast && payload.isSubtotal ? 2 : 0
            return (
              <rect
                x={props.x}
                y={props.y}
                width={props.width}
                height={props.height}
                fill={color}
                stroke={stroke}
                strokeWidth={strokeW}
                rx={3}
              />
            )
          }}
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
  )
}
