import { useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import { useCurrency } from '@/components/providers/currency-provider'
import { cn } from '@/lib/utils'

export type WaterfallMeasure = 'absolute' | 'relative' | 'total'

export type WaterfallStep = {
  label: string
  value: number
  measure: WaterfallMeasure
}

type PnlWaterfallPanelProps = {
  steps: WaterfallStep[]
  heightClassName?: string
  accentColor?: string
}

type WaterfallBar = {
  start: number
  end: number
  delta: number
  fill: string
}

/** Subtotals / results drawn from zero for readability (commissions & COGS steps stay floating). */
const FULL_HEIGHT_LABELS = new Set([
  'ventas brutas',
  'gross revenue',
  'ventas netas',
  'net revenue',
  'utilidad bruta',
  'gross profit',
  'ebitda',
])

function isFullHeightBar(label: string): boolean {
  return FULL_HEIGHT_LABELS.has(label.trim().toLowerCase())
}

function splitCategoryLabel(text: string): string[] {
  if (text.length <= 18) return [text]
  const mid = Math.floor(text.length / 2)
  const space = text.lastIndexOf(' ', mid + 5)
  if (space > 4) {
    return [text.slice(0, space), text.slice(space + 1)]
  }
  return [text.slice(0, mid).trim(), text.slice(mid).trim()]
}

function barChangeArrow(delta: number): string {
  if (delta < 0) return '▼'
  if (delta > 0) return '▲'
  return '—'
}

export function PnlWaterfallPanel({
  steps,
  heightClassName = 'h-[300px]',
  accentColor = 'var(--accent)',
}: PnlWaterfallPanelProps) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency()
  const W = 920
  const H = 288
  const padL = 56
  const padR = 14
  const padT = 28
  const padB = 52
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const { bars, minV, maxV } = useMemo(() => {
    const pos = 'var(--success)'
    const neg = 'var(--chart-waterfall-negative)'

    const computedBars: WaterfallBar[] = []
    let current = 0
    const values: number[] = [0]

    for (const s of steps) {
      let end: number
      if (s.measure === 'absolute' || s.measure === 'total') {
        end = s.value
      } else {
        end = current + s.value
      }

      const start = current
      const delta = end - start

      const fill =
        s.measure === 'absolute' || s.measure === 'total'
          ? accentColor
          : delta >= 0
            ? pos
            : neg

      computedBars.push({ start, end, delta, fill })
      current = end
      values.push(start, end)
    }

    let minV = Math.min(...values, 0)
    let maxV = Math.max(...values, 0)
    const pad = (maxV - minV) * 0.06 || Math.max(Math.abs(maxV), 1) * 0.05
    minV -= pad
    maxV += pad
    if (minV === maxV) {
      minV -= 1
      maxV += 1
    }

    return { bars: computedBars, minV, maxV }
  }, [steps, accentColor])

  const tickCount = 5
  const yTicks = Array.from({ length: tickCount }, (_, i) => {
    return minV + (i / (tickCount - 1)) * (maxV - minV)
  })

  const safeRange = maxV - minV || 1
  const yScale = (v: number) => padT + ((maxV - v) / safeRange) * plotH
  const barGap = 14
  const barW = plotW / Math.max(steps.length, 1) - barGap
  const xFor = (i: number) => padL + i * (barW + barGap)

  const zeroY = yScale(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{
    index: number
    leftPct: number
    topPct: number
  } | null>(null)

  function syncTooltipPosition(index: number) {
    const container = containerRef.current
    const svg = svgRef.current
    if (!container || !svg || index < 0 || index >= bars.length) return

    const b = bars[index]
    const label = steps[index]?.label ?? ''
    const fullHeight = isFullHeightBar(label)
    const y0 = yScale(0)
    const y1 = yScale(b.start)
    const y2 = yScale(b.end)
    let y: number
    if (fullHeight) {
      y = Math.min(y0, y2)
    } else {
      y = Math.min(y1, y2)
    }

    const x = xFor(index)
    const pt = svg.createSVGPoint()
    pt.x = x + barW / 2
    pt.y = y
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const screen = pt.matrixTransform(ctm)
    const cr = container.getBoundingClientRect()
    const leftPct = ((screen.x - cr.left) / cr.width) * 100
    const topPct = ((screen.y - cr.top) / cr.height) * 100
    setTooltip({ index, leftPct, topPct })
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full min-h-0 text-text-primary [&_svg]:overflow-visible',
        heightClassName
      )}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        role="img"
        aria-label="P and L waterfall"
      >
        {yTicks.map((tv, ti) => {
          const yy = yScale(tv)
          return (
            <g key={ti}>
              <line
                x1={padL}
                x2={W - padR}
                y1={yy}
                y2={yy}
                stroke="var(--chart-grid)"
                strokeDasharray="4 8"
                opacity={0.4}
              />
              <text
                x={padL - 8}
                y={yy}
                dy={4}
                textAnchor="end"
                fill="var(--text-tertiary)"
                fontSize={10}
                fontFamily="var(--font-mono)"
              >
                {formatCurrencyCompact(tv)}
              </text>
            </g>
          )
        })}

        <line
          x1={padL}
          x2={W - padR}
          y1={zeroY}
          y2={zeroY}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
        />

        {bars.slice(0, -1).map((b, i) => {
          const yy = yScale(b.end)
          const x1 = xFor(i) + barW
          const x2 = xFor(i + 1)
          return (
            <line
              key={`waterfall-connector-${i}`}
              x1={x1}
              x2={x2}
              y1={yy}
              y2={yy}
              stroke="var(--chart-waterfall-connector)"
              strokeWidth={1.25}
              strokeDasharray="5 5"
            />
          )
        })}

        {bars.map((b, i) => {
          const step = steps[i]
          const label = step?.label ?? ''
          const fullHeight = isFullHeightBar(label)
          const yStart = yScale(b.start)
          const yEnd = yScale(b.end)
          const yZero = yScale(0)

          let y: number
          let h: number
          if (fullHeight) {
            y = Math.min(yZero, yEnd)
            h = Math.max(2, Math.abs(yEnd - yZero))
          } else {
            y = Math.min(yStart, yEnd)
            h = Math.max(2, Math.abs(yEnd - yStart))
          }

          const lines = splitCategoryLabel(label)

          const topValueLabel =
            fullHeight
              ? formatCurrency(b.end)
              : step?.measure === 'relative'
                ? formatCurrency(step.value)
                : formatCurrency(b.end)
          const barTopY = fullHeight ? Math.min(yZero, yEnd) : Math.min(yStart, yEnd)
          const topValueLabelY = barTopY - 8

          const x = xFor(i)
          const cx = x + barW / 2

          const lineStrokeY = fullHeight ? yEnd : yStart

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={4}
                fill={b.fill}
                className="cursor-default"
                onMouseEnter={() => syncTooltipPosition(i)}
                onMouseMove={() => syncTooltipPosition(i)}
                onMouseLeave={() => setTooltip(null)}
              />
              {b.delta === 0 ? (
                <line
                  x1={x}
                  x2={x + barW}
                  y1={lineStrokeY}
                  y2={lineStrokeY}
                  stroke={b.fill}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              ) : null}

              <text
                x={cx}
                y={topValueLabelY}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize={11}
                fontWeight={500}
                fontFamily="var(--font-mono)"
                className="pointer-events-none"
              >
                {topValueLabel}
              </text>

              {lines.length === 1 ? (
                <text
                  x={cx}
                  y={H - 28}
                  textAnchor="middle"
                  fill="var(--text-secondary)"
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                  className="pointer-events-none"
                >
                  {lines[0]}
                </text>
              ) : (
                <text
                  x={cx}
                  y={H - 36}
                  textAnchor="middle"
                  fill="var(--text-secondary)"
                  fontSize={10}
                  fontFamily="var(--font-mono)"
                  className="pointer-events-none"
                >
                  <tspan x={cx} dy={0}>
                    {lines[0]}
                  </tspan>
                  <tspan x={cx} dy={13}>
                    {lines[1]}
                  </tspan>
                </text>
              )}

            </g>
          )
        })}
      </svg>

      {tooltip !== null && steps[tooltip.index] ? (
        <WaterfallTooltip
          style={{
            left: `${tooltip.leftPct}%`,
            top: `${tooltip.topPct}%`,
          }}
          label={steps[tooltip.index].label}
          accumulated={bars[tooltip.index].end}
          initial={bars[tooltip.index].start}
          delta={
            steps[tooltip.index].measure === 'relative'
              ? steps[tooltip.index].value
              : bars[tooltip.index].delta
          }
          formatCurrency={formatCurrency}
          formatCurrencyCompact={formatCurrencyCompact}
        />
      ) : null}
    </div>
  )
}

type WaterfallTooltipProps = {
  style: CSSProperties
  label: string
  accumulated: number
  initial: number
  delta: number
  formatCurrency: (value: string | number) => string
  formatCurrencyCompact: (value: string | number) => string
}

function WaterfallTooltip({
  style,
  label,
  accumulated,
  initial,
  delta,
  formatCurrency: fc,
  formatCurrencyCompact: fcc,
}: WaterfallTooltipProps) {
  const absMag = Math.abs(delta)
  const arrow = barChangeArrow(delta)

  return (
    <div
      className="pointer-events-none absolute z-20 min-w-40 -translate-x-1/2 -translate-y-full rounded-md border border-white/15 bg-(--popover)/95 px-2.5 py-2 text-left font-mono text-[11px] leading-snug text-popover-foreground shadow-lg backdrop-blur-sm"
      style={style}
    >
      <div>
        ({label}, {fcc(accumulated)})
      </div>
      <div>{fc(absMag)}</div>
      <div>
        ({fcc(absMag)}) {arrow}
      </div>
      <div className="text-text-tertiary">
        Initial: {fcc(initial)}
      </div>
    </div>
  )
}
