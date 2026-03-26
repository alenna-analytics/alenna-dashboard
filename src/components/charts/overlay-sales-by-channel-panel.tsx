import { useMemo } from 'react'

import { chartPlotSurfaceClassName } from '@/components/charts/chart-theme'
import { useCurrency } from '@/components/providers/currency-provider'
import { cn } from '@/lib/utils'

export type SalesChannel = 'shopify' | 'amazon' | 'mercadolibre'

export type OverlaySalesDatum = {
  periodKey: string
  periodLabel: string
  grossByChannel: Record<SalesChannel, number>
  netByChannel: Record<SalesChannel, number>
}

export type OverlaySalesSelection = {
  periodKey: string
  channel: SalesChannel
  gross: number
  net: number
}

type OverlaySalesByChannelPanelProps = {
  data: OverlaySalesDatum[]
  channels: SalesChannel[]
  channelLabels: Record<SalesChannel, string>
  colorsByChannel: Record<SalesChannel, string>
  grossLabel: string
  netLabel: string
  onSelect: (sel: OverlaySalesSelection) => void
  heightClassName?: string
}

const MIN_PERIOD_PX = 76
const Y_TICKS = 5

export function OverlaySalesByChannelPanel({
  data,
  channels,
  channelLabels,
  colorsByChannel,
  grossLabel,
  netLabel,
  onSelect,
  heightClassName = 'h-[380px]',
}: OverlaySalesByChannelPanelProps) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency()

  const padL = 52
  const padR = 12
  const padT = 10
  const padB = 42
  const plotH = 236

  const periodsN = Math.max(data.length, 1)
  const nCh = Math.max(channels.length, 1)

  const { W, H, plotW, maxV, yTicks } = useMemo(() => {
    const plotWInner = Math.max(320, periodsN * MIN_PERIOD_PX)
    const Wtotal = padL + plotWInner + padR
    const Htotal = padT + plotH + padB
    let m = 0
    for (const d of data) {
      for (const c of channels) {
        m = Math.max(m, d.grossByChannel[c] ?? 0, d.netByChannel[c] ?? 0)
      }
    }
    const maxVal = m || 1
    const ticks = Array.from({ length: Y_TICKS }, (_, i) => (maxVal * i) / (Y_TICKS - 1))
    return {
      W: Wtotal,
      H: Htotal,
      plotW: plotWInner,
      maxV: maxVal,
      yTicks: ticks,
    }
  }, [data, channels, periodsN, padL, padR, padT, padB, plotH])

  const yScale = (v: number) => padT + plotH - (v / maxV) * plotH
  const zeroY = yScale(0)

  const periodW = plotW / periodsN
  const channelSlotW = periodW / nCh
  const pairW = channelSlotW * 0.88
  const barGap = pairW * 0.12
  const barW = (pairW - barGap) / 2

  const xPairStart = (periodIdx: number, channelIdx: number) =>
    padL +
    periodIdx * periodW +
    channelIdx * channelSlotW +
    (channelSlotW - pairW) / 2

  return (
    <div className={cn('flex w-full min-w-0 flex-col', heightClassName)}>
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-0.5">
        <span className="text-[10px] text-text-tertiary">
          <span className="mr-1 inline-block size-2 rounded-sm bg-text-tertiary/40 align-middle" />
          {grossLabel}
          <span className="mx-2 text-text-tertiary/50">·</span>
          <span className="mr-1 inline-block size-2 rounded-sm bg-text-tertiary align-middle" />
          {netLabel}
        </span>
        {channels.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono text-text-secondary"
          >
            <span
              className="inline-flex gap-0.5 rounded-sm border border-border-subtle p-px"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <span
                className="size-2 rounded-[2px]"
                style={{ background: colorsByChannel[c], opacity: 0.38 }}
                title={grossLabel}
              />
              <span
                className="size-2 rounded-[2px]"
                style={{ background: colorsByChannel[c], opacity: 1 }}
                title={netLabel}
              />
            </span>
            {channelLabels[c]}
          </span>
        ))}
      </div>

      <div
        className={cn(
          'min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden rounded-lg border border-border-subtle/60',
          chartPlotSurfaceClassName,
        )}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMinYMin meet"
          className="block h-full w-full"
          style={{ minWidth: `${W}px` }}
        >
          {yTicks.map((tv) => {
            const yy = yScale(tv)
            return (
              <g key={tv}>
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={yy}
                  y2={yy}
                  stroke="var(--chart-grid)"
                  strokeDasharray="3 6"
                  strokeOpacity={0.5}
                />
                <text
                  x={padL - 6}
                  y={yy}
                  dy={3}
                  textAnchor="end"
                  fill="var(--text-tertiary)"
                  fontSize={9}
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
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={1}
          />

          {data.map((d, pIdx) => {
            const xCenter = padL + pIdx * periodW + periodW / 2
            return (
              <g key={d.periodKey}>
                <line
                  x1={xCenter}
                  x2={xCenter}
                  y1={padT}
                  y2={padT + plotH}
                  stroke="var(--chart-grid)"
                  strokeOpacity={0.35}
                />
                <text
                  x={xCenter}
                  y={H - 10}
                  textAnchor="middle"
                  fill="var(--text-tertiary)"
                  fontSize={9}
                  fontFamily="var(--font-mono)"
                >
                  {d.periodLabel}
                </text>

                {channels.map((c, cIdx) => {
                  const gross = d.grossByChannel[c] ?? 0
                  const net = d.netByChannel[c] ?? 0
                  const grossY = yScale(gross)
                  const netY = yScale(net)
                  const grossH = Math.max(1, zeroY - grossY)
                  const netH = Math.max(1, zeroY - netY)
                  const x0 = xPairStart(pIdx, cIdx)
                  const xGross = x0
                  const xNet = x0 + barW + barGap

                  const onClick = () =>
                    onSelect({
                      periodKey: d.periodKey,
                      channel: c,
                      gross,
                      net,
                    })

                  const color = colorsByChannel[c]

                  return (
                    <g key={c}>
                      <rect
                        x={xGross}
                        y={grossY}
                        width={barW}
                        height={grossH}
                        rx={3}
                        fill={color}
                        fillOpacity={0.38}
                        onClick={onClick}
                        style={{ cursor: 'pointer' }}
                      >
                        <title>
                          {channelLabels[c]} — {grossLabel}: {formatCurrency(gross)}
                        </title>
                      </rect>
                      <rect
                        x={xNet}
                        y={netY}
                        width={barW}
                        height={netH}
                        rx={3}
                        fill={color}
                        fillOpacity={1}
                        onClick={onClick}
                        style={{ cursor: 'pointer' }}
                      >
                        <title>
                          {channelLabels[c]} — {netLabel}: {formatCurrency(net)}
                        </title>
                      </rect>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
