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
}

type WaterfallChartProps = {
  segments: Segment[]
  currency: string
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

function buildBars(segments: Segment[]): WaterfallBar[] {
  let running = 0
  return segments.map((seg) => {
    if (seg.isSubtotal) {
      const bar: WaterfallBar = {
        name: seg.name,
        spacer: 0,
        bar: seg.value,
        isSubtotal: true,
        isNegative: false,
        rawValue: seg.value,
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
    }
    if (seg.isNegative) {
      running -= abs
    } else {
      running += abs
    }
    return bar
  })
}

function BarLabel({ x, y, width, height, value, isNegative }: {
  x?: number
  y?: number
  width?: number
  height?: number
  value?: number
  isNegative?: boolean
}) {
  if (value === undefined || x === undefined || y === undefined || width === undefined) return null
  const cx = x + (width ?? 0) / 2
  const cy = (isNegative || (height !== undefined && height < 0)) ? (y ?? 0) + (height ?? 0) - 4 : (y ?? 0) - 4
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

const CustomTooltip = ({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: Array<{ payload: WaterfallBar }>
  currency: string
}) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const sign = d.isNegative && !d.isSubtotal ? '-' : ''
  const val = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(d.rawValue)
  return (
    <div className="rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-text-primary">{d.name}</p>
      <p className="mt-0.5 text-text-secondary">
        {sign}
        {val}
      </p>
    </div>
  )
}

export function WaterfallChart({ segments, currency }: WaterfallChartProps) {
  const bars = buildBars(segments)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={bars} margin={{ top: 24, right: 8, bottom: 0, left: 8 }}>
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
          angle={-30}
          textAnchor="end"
          height={52}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => fmt(v)}
          width={48}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} cursor={false} />

        {/* Invisible spacer — stacks beneath the visible bar */}
        <Bar dataKey="spacer" stackId="wf" fill="transparent" />

        {/* Visible bar — color driven by type */}
        <Bar
          dataKey="bar"
          stackId="wf"
          radius={[3, 3, 0, 0]}
          fill="var(--color-chart-1)"
          shape={(props: { x: number; y: number; width: number; height: number; payload: WaterfallBar }) => {
            const { x, y, width, height, payload } = props
            let color = 'var(--color-chart-1)'
            if (payload.isSubtotal) color = 'var(--color-chart-2)'
            else if (payload.isNegative) color = 'var(--color-chart-5)'
            return <rect x={x} y={y} width={width} height={height} fill={color} rx={3} />
          }}
        >
          <LabelList
            dataKey="rawValue"
            content={(props) => (
              <BarLabel
                {...props}
                isSubtotal={bars[Number(props.index ?? 0)]?.isSubtotal}
                isNegative={bars[Number(props.index ?? 0)]?.isNegative}
              />
            )}
          />
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  )
}
