import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
} from 'recharts'
import type { BarShapeProps } from 'recharts'
import type { ReactElement } from 'react'

export type WaterfallSegmentPart = {
  name: string
  value: number
  isNegative: boolean
}

export type Segment = {
  name: string
  value: number
  isSubtotal: boolean
  isNegative: boolean
  /** Renders as one stacked column (e.g. gross → net adjustments). */
  stackedParts?: WaterfallSegmentPart[]
}

type WaterfallStackSlice = {
  name: string
  value: number
  rawValue: number
}

type WaterfallBar = {
  name: string
  spacer: number
  bar: number
  /** Cumulative value after this segment; used for connector Y position. */
  runningAfter: number
  domainMax: number
  isSubtotal: boolean
  isNegative: boolean
  rawValue: number
  pctOfGross: number | null
  isLast: boolean
  stackedParts?: WaterfallStackSlice[]
}

type WaterfallChartProps = {
  segments: Segment[]
  currency: string
  grossRevenue: number
  formatPctOfGross: (pct: number) => string
  finalBarCaption?: string
}

type BarLabelProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  value?: number
  isNegative?: boolean
  fill: string
}

type TooltipPayloadItem = {
  payload: Record<string, unknown> & WaterfallBar
}

type CustomTooltipProps = {
  active?: boolean
  payload?: TooltipPayloadItem[]
  currency: string
  formatPctOfGross: (pct: number) => string
  finalBarCaption?: string
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
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
    if (seg.stackedParts && seg.stackedParts.length > 0) {
      const totalBridge = Math.abs(seg.value)
      const spacer = seg.isNegative ? running - totalBridge : running
      const stackedParts: WaterfallStackSlice[] = seg.stackedParts.map((p) => {
        const mag = Math.abs(p.value)
        return {
          name: p.name,
          value: mag,
          rawValue: p.isNegative ? -mag : mag,
        }
      })
      if (seg.isNegative) {
        running -= totalBridge
      } else {
        running += totalBridge
      }
      const bar: WaterfallBar = {
        name: seg.name,
        spacer,
        bar: totalBridge,
        runningAfter: running,
        domainMax: 0,
        isSubtotal: false,
        isNegative: Boolean(seg.isNegative),
        rawValue: seg.isNegative ? -totalBridge : totalBridge,
        pctOfGross: null,
        isLast: false,
        stackedParts,
      }
      return bar
    }
    if (seg.isSubtotal) {
      running = seg.value
      const bar: WaterfallBar = {
        name: seg.name,
        spacer: 0,
        bar: seg.value,
        runningAfter: running,
        domainMax: 0,
        isSubtotal: true,
        isNegative: false,
        rawValue: seg.value,
        pctOfGross: null,
        isLast: false,
      }
      return bar
    }
    const abs = Math.abs(seg.value)
    const spacer = seg.isNegative ? running - abs : running
    if (seg.isNegative) {
      running -= abs
    } else {
      running += abs
    }
    const bar: WaterfallBar = {
      name: seg.name,
      spacer,
      bar: abs,
      runningAfter: running,
      domainMax: 0,
      isSubtotal: false,
      isNegative: seg.isNegative,
      rawValue: seg.value,
      pctOfGross: null,
      isLast: false,
    }
    return bar
  })

  const withPct = rows.map((b, i, arr) => {
    const isLast = i === arr.length - 1
    const pctOfGross =
      grossRevenue !== 0 ? (Math.abs(b.rawValue) / Math.abs(grossRevenue)) * 100 : null
    return { ...b, isLast, pctOfGross }
  })

  const domainMax = Math.max(1, ...withPct.map((b) => b.spacer + b.bar))

  return withPct.map((b) => ({ ...b, domainMax }))
}

function barFillSolid(payload: WaterfallBar): string {
  if (payload.isSubtotal) {
    return 'var(--primary)'
  }
  if (payload.isNegative) {
    return 'var(--danger)'
  }
  return 'var(--brand-light)'
}

function labelFillForBar(row: WaterfallBar | undefined): string {
  if (!row) return 'var(--text-primary)'
  if (row.isSubtotal) return 'var(--primary-foreground)'
  if (row.isNegative) return 'var(--primary-foreground)'
  if (row.stackedParts && row.stackedParts.length > 0) return 'var(--primary-foreground)'
  return 'var(--text-primary)'
}

/** Hatched gap below floating bars (spacer segment only); one column with the solid bar. */
function SpacerHatchShape(props: BarShapeProps) {
  const x = props.x ?? 0
  const y = props.y ?? 0
  const w = props.width ?? 0
  const h = props.height ?? 0
  if (h <= 0 || w <= 0) return null
  const rx = Math.min(12, w / 2, h / 2)
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill="url(#wfUnfilledHatch)"
      rx={rx}
      ry={rx}
      stroke="var(--card-solid-border)"
      strokeWidth={1}
      strokeOpacity={0.45}
    />
  )
}

function StackedWaterfallBarShape({
  x,
  y,
  w,
  h,
  parts,
}: {
  x: number
  y: number
  w: number
  h: number
  parts: WaterfallStackSlice[]
}) {
  const weight = parts.reduce((s, p) => s + p.value, 0)
  const rxCap = Math.min(12, w / 2)
  if (weight <= 0 && h > 0) {
    return (
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="var(--danger)"
        rx={rxCap}
        ry={rxCap}
        fillOpacity={0.35}
      />
    )
  }
  if (weight <= 0) {
    return null
  }
  let yCursor = y
  let shadeIndex = 0
  return (
    <g>
      {parts.map((p, i) => {
        const hi = (p.value / weight) * h
        if (hi <= 0) {
          return null
        }
        const r = Math.min(rxCap, w / 2, Math.max(hi / 2, 2))
        const node = (
          <rect
            key={`${p.name}-${i}`}
            x={x}
            y={yCursor}
            width={w}
            height={hi}
            fill="var(--danger)"
            fillOpacity={Math.max(0.52, 1 - shadeIndex * 0.11)}
            rx={r}
            ry={r}
            stroke="var(--card)"
            strokeWidth={1}
          />
        )
        yCursor += hi
        shadeIndex += 1
        return node
      })}
    </g>
  )
}

function WaterfallBarShape(props: BarShapeProps) {
  const payload = props.payload as WaterfallBar | undefined
  const x = props.x ?? 0
  const y = props.y ?? 0
  const w = props.width ?? 0
  const h = props.height ?? 0
  if (payload === undefined || h <= 0 || w <= 0) return null

  if (payload.stackedParts && payload.stackedParts.length > 0) {
    return (
      <StackedWaterfallBarShape x={x} y={y} w={w} h={h} parts={payload.stackedParts} />
    )
  }

  const fill = barFillSolid(payload)
  const isFinal = payload.isLast && payload.isSubtotal
  const rx = Math.min(12, w / 2, h / 2)

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
          filter: isFinal ? 'var(--wf-bar-filter-final)' : undefined,
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

function BarLabel({ x, y, width, height, value, isNegative, fill }: BarLabelProps) {
  if (
    value === undefined ||
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined
  ) {
    return null
  }
  const h = height
  if (h < 12) {
    return null
  }
  const cx = x + width / 2
  const cy = y + h / 2
  const display = fmt(value)
  const fs = h < 22 ? 9 : 10
  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={fs}
      fontWeight={600}
      fill={fill}
    >
      {isNegative && value !== 0 ? `-${display}` : display}
    </text>
  )
}

function WaterfallConnectors({ bars }: { bars: WaterfallBar[] }) {
  const xMap = useXAxisScale()
  const yMap = useYAxisScale()
  if (!xMap || !yMap || bars.length < 2) {
    return null
  }
  const lines: ReactElement[] = []
  for (let i = 0; i < bars.length - 1; i++) {
    const x1 = xMap(bars[i].name, { position: 'end' })
    const x2 = xMap(bars[i + 1].name, { position: 'start' })
    const y = yMap(bars[i].runningAfter)
    if (x1 === undefined || x2 === undefined || y === undefined) {
      continue
    }
    lines.push(
      <line
        key={`wf-conn-${i}`}
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="var(--chart-waterfall-connector)"
        strokeWidth={1.25}
        strokeDasharray="4 4"
        opacity={0.92}
      />,
    )
  }
  if (lines.length === 0) {
    return null
  }
  return <g pointerEvents="none">{lines}</g>
}

function CustomTooltip({
  active,
  payload,
  currency,
  formatPctOfGross,
  finalBarCaption,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as WaterfallBar
  const sign = d.isNegative && !d.isSubtotal ? '-' : ''
  const val = formatMoney(d.rawValue, currency)
  const impact =
    d.pctOfGross !== null && !Number.isNaN(d.pctOfGross)
      ? formatPctOfGross(d.pctOfGross)
      : null

  if (d.stackedParts && d.stackedParts.length > 0) {
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
        <ul className="mt-2 max-h-52 space-y-1.5 overflow-y-auto border-t border-border-subtle pt-2">
          {d.stackedParts.map((line) => (
            <li key={line.name} className="flex justify-between gap-6 text-[11px]">
              <span className="min-w-0 shrink text-text-tertiary">{line.name}</span>
              <span className="shrink-0 tabular-nums text-text-primary">
                {formatMoney(line.rawValue, currency)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

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

export function WaterfallChart({
  segments,
  currency,
  grossRevenue,
  formatPctOfGross,
  finalBarCaption,
}: WaterfallChartProps) {
  const bars = buildBars(segments, grossRevenue)
  const domainMax = bars[0]?.domainMax ?? 1

  return (
    <div className="w-full">
      <div className="surface-chart-card relative overflow-hidden rounded-[1.75rem] p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
        <div className="relative z-1">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={bars}
              margin={{ top: 12, right: 10, bottom: 28, left: 4 }}
              maxBarSize={56}
              barCategoryGap="12%"
            >
              <defs>
                <pattern
                  id="wfUnfilledHatch"
                  width={7}
                  height={7}
                  patternUnits="userSpaceOnUse"
                >
                  <rect width={7} height={7} fill="var(--chart-wf-unfilled-bg)" />
                  <path
                    d="M0 7 L7 0 M-1.5 1.5 L1.5 -1.5 M5.5 8.5 L8.5 5.5"
                    stroke="var(--chart-wf-unfilled-line)"
                    strokeWidth={0.85}
                  />
                </pattern>
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
                angle={0}
                textAnchor="middle"
                tickMargin={6}
                minTickGap={2}
                height={34}
              />
              <YAxis
                domain={[0, domainMax]}
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

              <WaterfallConnectors bars={bars} />

              <Bar
                dataKey="spacer"
                stackId="wf"
                fill="url(#wfUnfilledHatch)"
                shape={SpacerHatchShape}
                isAnimationActive
                animationDuration={420}
                animationEasing="ease-out"
              />

              <Bar
                dataKey="bar"
                stackId="wf"
                radius={[12, 12, 0, 0]}
                fill="var(--chart-1)"
                shape={WaterfallBarShape}
                isAnimationActive
                animationDuration={480}
                animationEasing="ease-out"
              >
                <LabelList
                  dataKey="rawValue"
                  content={(props) => {
                    const idx = Number(props.index ?? 0)
                    const row = bars[idx]
                    const x = typeof props.x === 'number' ? props.x : Number(props.x)
                    const y = typeof props.y === 'number' ? props.y : Number(props.y)
                    const width =
                      typeof props.width === 'number' ? props.width : Number(props.width)
                    const height =
                      typeof props.height === 'number' ? props.height : Number(props.height)
                    return (
                      <BarLabel
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        value={typeof props.value === 'number' ? props.value : undefined}
                        isNegative={row?.isNegative}
                        fill={labelFillForBar(row)}
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
