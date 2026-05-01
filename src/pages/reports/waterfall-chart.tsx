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
  /** spacer + bar; unstacked column height for Recharts. */
  totalStack: number
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

function xAxisLabelLines(name: string): { line1: string; line2: string | null } {
  const t = name.trim()
  if (t.length <= 12) {
    return { line1: t, line2: null }
  }
  const w = t.split(/\s+/)
  if (w.length >= 2) {
    const mid = Math.max(1, Math.ceil(w.length / 2))
    return { line1: w.slice(0, mid).join(' '), line2: w.slice(mid).join(' ') }
  }
  if (t.length > 20) {
    return { line1: `${t.slice(0, 16)}…`, line2: null }
  }
  return { line1: t, line2: null }
}

function WaterfallXAxisTick(
  props: { x?: string | number; y?: string | number; payload?: { value?: string } } & Record<string, unknown>,
) {
  const x = Number(props.x ?? 0)
  const y = Number(props.y ?? 0)
  const text = String(props.payload?.value ?? '')
  const { line1, line2 } = xAxisLabelLines(text)
  return (
    <g transform={`translate(${x},${y})`} className="recharts-cartesian-axis-tick">
      <text
        x={0}
        y={0}
        textAnchor="middle"
        fill="var(--color-text-secondary)"
        fontSize={9.5}
        className="select-none"
        style={{ textRendering: 'geometricPrecision' }}
      >
        <tspan x={0} dy={10} fontWeight={500}>
          {line1}
        </tspan>
        {line2 ? (
          <tspan x={0} dy={12.5} fontWeight={500}>
            {line2}
          </tspan>
        ) : null}
      </text>
    </g>
  )
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
      const ts = spacer + totalBridge
      const bar: WaterfallBar = {
        name: seg.name,
        spacer,
        bar: totalBridge,
        totalStack: ts,
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
        totalStack: seg.value,
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
    const ts = spacer + abs
    const bar: WaterfallBar = {
      name: seg.name,
      spacer,
      bar: abs,
      totalStack: ts,
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

/** Full negative bar fill — KPI bad-delta palette (`kpi-card.tsx`). */
const WF_NEG_BG = 'var(--kpi-pill-negative-bg)'
const WF_NEG_TEXT = 'var(--kpi-pill-negative-text)'
/** Gray only for floating spacer above the bridge (not the bar itself). */
const WF_GAP_FILL = 'var(--chart-wf-negative-neutral-fill)'
const WF_GAP_STROKE = 'var(--chart-wf-negative-neutral-stroke)'

function barFillSolid(payload: WaterfallBar): string {
  if (payload.isSubtotal) {
    return 'var(--primary)'
  }
  if (payload.isNegative) {
    return WF_NEG_BG
  }
  return 'var(--primary)'
}

function labelFillForBar(row: WaterfallBar | undefined): string {
  if (!row) return 'var(--text-primary)'
  if (row.isSubtotal) return 'var(--primary-foreground)'
  if (row.isNegative) return WF_NEG_TEXT
  if (row.stackedParts && row.stackedParts.length > 0) return 'var(--primary-foreground)'
  return 'var(--text-primary)'
}

function isNegativeSegmentPayload(payload: WaterfallBar | undefined): boolean {
  return Boolean(payload && !payload.isSubtotal && payload.isNegative)
}

/** Hatched gap below floating bars (spacer segment only); one column with the solid bar. */
function SpacerHatchShape(props: BarShapeProps) {
  const payload = props.payload as WaterfallBar | undefined
  const x = props.x ?? 0
  const y = props.y ?? 0
  const w = props.width ?? 0
  const h = props.height ?? 0
  if (h <= 0 || w <= 0) return null
  const rx = Math.min(12, w / 2, h / 2)
  const neg = isNegativeSegmentPayload(payload)
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill={neg ? WF_GAP_FILL : 'url(#wfUnfilledHatch)'}
      rx={rx}
      ry={rx}
      stroke={neg ? WF_GAP_STROKE : 'var(--card-solid-border)'}
      strokeWidth={1}
      strokeOpacity={neg ? 1 : 0.3}
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
        fill={WF_NEG_BG}
        rx={rxCap}
        ry={rxCap}
        fillOpacity={1}
      />
    )
  }
  if (weight <= 0) {
    return null
  }
  const segments: { p: WaterfallStackSlice; i: number; yTop: number; hi: number; shadeIndex: number }[] = []
  let yCursor = y
  let shadeIndex = 0
  for (let i = 0; i < parts.length; i += 1) {
    const p = parts[i]
    const hi = (p.value / weight) * h
    if (hi <= 0) {
      continue
    }
    segments.push({ p, i, yTop: yCursor, hi, shadeIndex })
    yCursor += hi
    shadeIndex += 1
  }
  return (
    <g>
      {segments.map(({ p, i, yTop, hi, shadeIndex: si }) => {
        const r = Math.min(rxCap, w / 2, Math.max(hi / 2, 2))
        return (
          <rect
            key={`${p.name}-${i}`}
            x={x}
            y={yTop}
            width={w}
            height={hi}
            fill={WF_NEG_BG}
            fillOpacity={Math.max(0.72, 0.96 - si * 0.06)}
            rx={r}
            ry={r}
            stroke={WF_NEG_TEXT}
            strokeOpacity={0.14}
            strokeWidth={1}
          />
        )
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
  const fillOpacity =
    payload.isSubtotal ? 1 : payload.isNegative ? 1 : 0.58

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fill}
        fillOpacity={fillOpacity}
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

function WaterfallCombinedColumnShape(props: BarShapeProps) {
  const payload = props.payload as WaterfallBar | undefined
  const x = props.x ?? 0
  const y = props.y ?? 0
  const w = props.width ?? 0
  const h = props.height ?? 0
  if (payload === undefined || h <= 0 || w <= 0) {
    return null
  }
  const total = payload.spacer + payload.bar
  if (total <= 0) {
    return null
  }
  const hVal = (payload.bar / total) * h
  const hGray = (payload.spacer / total) * h
  const yValTop = y
  const yGrayTop = y + hVal
  return (
    <g>
      {hGray > 0 ? (
        <SpacerHatchShape {...props} x={x} y={yGrayTop} width={w} height={hGray} />
      ) : null}
      {hVal > 0 ? (
        <WaterfallBarShape {...props} x={x} y={yValTop} width={w} height={hVal} />
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
  const mag = Math.abs(value)
  const displayAbs = fmt(mag)
  const labelText = isNegative && value !== 0 ? `-${displayAbs}` : displayAbs
  const fs = h < 22 ? 9 : 11
  const textFill =
    isNegative && value !== 0 ? WF_NEG_TEXT : fill
  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={fs}
      fontWeight={700}
      fill={textFill}
    >
      {labelText}
    </text>
  )
}

function bandGapXs(
  xMap: NonNullable<ReturnType<typeof useXAxisScale>>,
  bw: number | undefined,
  leftCat: string,
  rightCat: string,
): { x1?: number; x2?: number } {
  let x1 = xMap(leftCat, { position: 'end' })
  let x2 = xMap(rightCat, { position: 'start' })
  if ((x1 === undefined || x2 === undefined) && bw !== undefined && bw > 0) {
    const sL = xMap(leftCat, { position: 'start' })
    const sR = xMap(rightCat, { position: 'start' })
    x1 = x1 ?? (sL !== undefined ? sL + bw : undefined)
    x2 = x2 ?? sR
  }
  return { x1, x2 }
}

function bandWidthFromScale(
  xMap: NonNullable<ReturnType<typeof useXAxisScale>>,
  category: string,
): number | undefined {
  const s = xMap(category, { position: 'start' })
  const e = xMap(category, { position: 'end' })
  if (s === undefined || e === undefined) return undefined
  const w = Math.abs(e - s)
  return w > 0 ? w : undefined
}

function WaterfallConnectors({ bars }: { bars: WaterfallBar[] }) {
  const xMap = useXAxisScale()
  const yMap = useYAxisScale()
  if (!xMap || !yMap || bars.length < 2) {
    return null
  }
  const bw = bandWidthFromScale(xMap, bars[0]?.name ?? '')

  const lines: ReactElement[] = []
  for (let i = 0; i < bars.length - 1; i++) {
    const leftCat = bars[i]?.name
    const rightCat = bars[i + 1]?.name
    const { x1, x2 } = bandGapXs(xMap, bw, leftCat, rightCat)
    const y = yMap(bars[i].runningAfter)
    if (x1 === undefined || x2 === undefined || y === undefined) {
      continue
    }
    const span = Math.abs(x2 - x1)
    if (span < 1) {
      continue
    }
    lines.push(
      <line
        key={`wf-conn-${i}`}
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="var(--chart-wf-bridge-stroke)"
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />,
    )
  }
  if (lines.length === 0) {
    return null
  }
  return (
    <g className="recharts-waterfall-connectors" pointerEvents="none">
      {lines}
    </g>
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
  const d = payload[0].payload as WaterfallBar
  const sign = d.isNegative && !d.isSubtotal ? '-' : ''
  const val = formatMoney(d.rawValue, currency)
  const impact =
    d.pctOfGross !== null && !Number.isNaN(d.pctOfGross)
      ? formatPctOfGross(d.pctOfGross)
      : null

  if (d.stackedParts && d.stackedParts.length > 0) {
    return (
      <div className="rounded-[1.5rem] border border-border-default bg-bg-elevated/96 px-3.5 py-3 text-xs shadow-[var(--shadow-ink-md)]">
        <p className="font-medium text-text-primary">{d.name}</p>
        <p className="mt-0.5 text-text-secondary">
          {sign}
          {val}
        </p>
        {impact ? (
          <p className="mt-1 border-t border-border-subtle pt-1.5 text-[11px] text-text-tertiary">
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
    <div className="rounded-[1.5rem] border border-border-default bg-bg-elevated/96 px-3.5 py-3 text-xs shadow-[var(--shadow-ink-md)]">
      <p className="font-medium text-text-primary">{d.name}</p>
      <p className="mt-0.5 text-text-secondary">
        {sign}
        {val}
      </p>
      {impact ? (
        <p className="mt-1 border-t border-border-subtle pt-1.5 text-[11px] text-text-tertiary">
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
    <div className="w-full min-w-0">
      <div className="surface-chart-card relative overflow-x-auto overflow-y-visible rounded-[2rem] p-5 pb-7 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
        <div className="relative z-[1] min-w-[min(100%,44rem)]">
          <ResponsiveContainer width="100%" height={288}>
            <ComposedChart
              data={bars}
              margin={{ top: 12, right: 8, bottom: 6, left: 4 }}
              maxBarSize={76}
              barCategoryGap="7%"
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
                strokeDasharray="3 8"
                stroke="var(--chart-grid)"
              />
              <XAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                interval={0}
                height={56}
                tick={WaterfallXAxisTick}
                tickMargin={4}
              />
              <YAxis
                domain={[0, domainMax]}
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
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
                cursor={{ fill: 'var(--chart-wf-cursor-fill)' }}
              />

              <Bar
                dataKey="totalStack"
                fill="var(--chart-1)"
                shape={WaterfallCombinedColumnShape}
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
                    const yFull = typeof props.y === 'number' ? props.y : Number(props.y)
                    const width =
                      typeof props.width === 'number' ? props.width : Number(props.width)
                    const heightFull =
                      typeof props.height === 'number' ? props.height : Number(props.height)
                    const t = row?.totalStack ?? 0
                    const hVal =
                      t > 0 && row ? (row.bar / t) * heightFull : 0
                    return (
                      <BarLabel
                        x={x}
                        y={yFull}
                        width={width}
                        height={hVal}
                        value={typeof props.value === 'number' ? props.value : undefined}
                        isNegative={row?.isNegative}
                        fill={labelFillForBar(row)}
                      />
                    )
                  }}
                />
              </Bar>

              <WaterfallConnectors bars={bars} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
