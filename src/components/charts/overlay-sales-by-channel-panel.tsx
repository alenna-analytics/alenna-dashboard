import { useMemo } from 'react'

import { fmtCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

export type SalesChannel = 'shopify' | 'amazon' | 'mercadolibre'
export type OverlayBarKind = 'gross' | 'net'

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
  colorsByChannel: Record<SalesChannel, string>
  grossLabel: string
  netLabel: string
  onSelect: (sel: OverlaySalesSelection) => void
  heightClassName?: string
}

export function OverlaySalesByChannelPanel({
  data,
  channels,
  colorsByChannel,
  grossLabel,
  netLabel,
  onSelect,
  heightClassName = 'h-[360px]',
}: OverlaySalesByChannelPanelProps) {
  const W = 920
  const H = 300

  const padL = 54
  const padR = 16
  const padT = 12
  const padB = 72

  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const { maxV } = useMemo(() => {
    let m = 0
    for (const d of data) {
      for (const c of channels) {
        m = Math.max(m, d.grossByChannel[c] ?? 0, d.netByChannel[c] ?? 0)
      }
    }
    return { maxV: m || 1 }
  }, [data, channels])

  const yScale = (v: number) => padT + plotH - (v / maxV) * plotH
  const zeroY = yScale(0)

  const periodsN = Math.max(data.length, 1)
  const periodW = plotW / periodsN
  const cellW = periodW / Math.max(channels.length, 1)
  const barW = cellW * 0.55
  const xFor = (periodIdx: number, channelIdx: number) =>
    padL + periodIdx * periodW + channelIdx * cellW + (cellW - barW) / 2

  const grossOpacity = 0.16
  const netOpacity = 0.78

  return (
    <div className={cn('w-full min-h-0', heightClassName)}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <line
          x1={padL}
          x2={W - padR}
          y1={zeroY}
          y2={zeroY}
          stroke="rgba(255,255,255,0.1)"
        />

        <g>
          <text
            x={padL}
            y={14}
            fill="var(--text-tertiary)"
            fontSize={11}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
          >
            {grossLabel} (opacity) / {netLabel} (opacity)
          </text>
        </g>

        {data.map((d, pIdx) => {
          const xCenter = padL + pIdx * periodW + periodW / 2
          const showPeriod = pIdx % 1 === 0

          return (
            <g key={d.periodKey}>
              {showPeriod ? (
                <text
                  x={xCenter}
                  y={H - 48}
                  textAnchor="middle"
                  fill="var(--text-tertiary)"
                  fontSize={10}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
                >
                  {d.periodLabel}
                </text>
              ) : null}

              {channels.map((c, cIdx) => {
                const gross = d.grossByChannel[c] ?? 0
                const net = d.netByChannel[c] ?? 0

                const grossY = yScale(gross)
                const netY = yScale(net)

                const grossH = Math.max(1, zeroY - grossY)
                const netH = Math.max(1, zeroY - netY)

                const x = xFor(pIdx, cIdx)

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
                      x={x}
                      y={grossY}
                      width={barW}
                      height={grossH}
                      rx={4}
                      fill={color}
                      opacity={grossOpacity}
                      onClick={onClick}
                      style={{ cursor: 'pointer' }}
                    >
                      <title>{fmtCurrency(gross)}</title>
                    </rect>
                    <rect
                      x={x}
                      y={netY}
                      width={barW}
                      height={netH}
                      rx={4}
                      fill={color}
                      opacity={netOpacity}
                      onClick={onClick}
                      style={{ cursor: 'pointer' }}
                    >
                      <title>{fmtCurrency(net)}</title>
                    </rect>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

