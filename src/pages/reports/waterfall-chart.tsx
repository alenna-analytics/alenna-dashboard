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

const SLATE = '#414A61'
const ROSE = '#DA9790'
const RED = '#B76E6A'

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
  const rx = Math.min(8, w / 2)

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
          filter: isFinal
            ? 'drop-shadow(0 2px 8px rgba(65, 74, 97, 0.12)) drop-shadow(0 0 12px rgba(218, 151, 144, 0.25))'
            : 'drop-shadow(0 2px 6px rgba(65, 74, 97, 0.08))',
        }}
      />
      {isFinal ? (
        <rect
          x={x + 1}
          y={y + 1}
          width={w - 2}
          height={h - 2}
          fill="none"
          stroke="rgba(218, 151, 144, 0.85)"
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
    <div className="rounded-xl border border-white/50 bg-white/[0.82] px-3 py-2 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_32px_rgba(65,74,97,0.12)] backdrop-blur-lg">
      <p className="font-medium text-text-primary">{d.name}</p>
      <p className="mt-0.5 text-text-secondary">
        {sign}
        {val}
      </p>
      {impact ? (
        <p className="mt-1 border-t border-white/35 pt-1 text-[11px] text-text-tertiary">
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
  const items: Array<{ kind: 'solid' | 'final'; color: string; text: string }> = [
    { kind: 'solid', color: SLATE, text: labels.total },
    { kind: 'solid', color: RED, text: labels.deduction },
    { kind: 'solid', color: ROSE, text: labels.additive },
    { kind: 'final', color: SLATE, text: labels.final },
  ]
  return (
    <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 border-b border-white/30 pb-3 text-[11px] text-text-secondary">
      {items.map((item) => (
        <span key={item.text} className="inline-flex items-center gap-2">
          {item.kind === 'final' ? (
            <span
              className="size-3 shrink-0 rounded-sm border-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
              style={{
                borderColor: ROSE,
                backgroundColor: SLATE,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px rgba(218,151,144,0.2)`,
              }}
              aria-hidden
            />
          ) : (
            <span
              className="size-2.5 shrink-0 rounded-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
              style={{ backgroundColor: item.color }}
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

      <div className="relative overflow-hidden rounded-xl border border-white/40 bg-white/[0.18] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_8px_32px_rgba(65,74,97,0.06)] backdrop-blur-md">
        <div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-[0.45]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 6px,
              rgba(65, 74, 97, 0.04) 6px,
              rgba(65, 74, 97, 0.04) 7px
            )`,
          }}
          aria-hidden
        />
        <div className="relative z-[1]">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={bars} margin={{ top: 40, right: 10, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id="wfFillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5a6378" stopOpacity={1} />
                  <stop offset="55%" stopColor={SLATE} stopOpacity={1} />
                  <stop offset="100%" stopColor="#353c4f" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="wfFillFinal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5c667d" stopOpacity={1} />
                  <stop offset="50%" stopColor={SLATE} stopOpacity={1} />
                  <stop offset="100%" stopColor="#363d52" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="wfFillDed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c98984" stopOpacity={1} />
                  <stop offset="100%" stopColor={RED} stopOpacity={1} />
                </linearGradient>
                <linearGradient id="wfFillAdd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e8b4ae" stopOpacity={1} />
                  <stop offset="100%" stopColor={ROSE} stopOpacity={1} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 6"
                stroke="rgba(65, 74, 97, 0.1)"
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
                cursor={{ fill: 'rgba(218, 151, 144, 0.08)' }}
              />

              <Bar dataKey="spacer" stackId="wf" fill="transparent" />

              <Bar
                dataKey="bar"
                stackId="wf"
                radius={[8, 8, 0, 0]}
                fill={SLATE}
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
