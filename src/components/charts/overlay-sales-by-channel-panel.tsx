import { useLayoutEffect, useMemo, useRef, useState } from 'react'

import { chartPlotSurfaceClassName, tooltipContentStyle } from '@/components/charts/chart-theme'
import { useCurrency } from '@/components/providers/currency-provider'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type SalesChannel = 'shopify' | 'amazon' | 'mercadolibre'

export type OverlayBarLayout = 'grouped' | 'stacked'

export type OverlaySalesDatum = {
  periodKey: string
  periodLabel: string
  grossByChannel: Record<SalesChannel, number>
  netByChannel: Record<SalesChannel, number>
  profitByChannel: Record<SalesChannel, number>
  marginPctByChannel: Record<SalesChannel, number>
}

export type OverlaySalesSelection = {
  periodKey: string
  channel: SalesChannel
  gross: number
  net: number
}

export type OverlayTooltipRowLabels = {
  gross: string
  net: string
  profit: string
  margin: string
}

type OverlaySalesByChannelPanelProps = {
  data: OverlaySalesDatum[]
  channels: SalesChannel[]
  channelLabels: Record<SalesChannel, string>
  colorsByChannel: Record<SalesChannel, string>
  grossLabel: string
  netLabel: string
  tooltipRows: OverlayTooltipRowLabels
  barLayout: OverlayBarLayout
  visibilityMenuLabel: string
  visibilityMenuTitle: string
  visibilityGrossNetOptionLabel: string
  visibilityChannelsSectionLabel: string
  onSelect: (sel: OverlaySalesSelection) => void
  seriesVisible?: {
    gross: boolean
    net: boolean
    profit: boolean
    margin: boolean
  }
  heightClassName?: string
}

type HoverTip = {
  px: number
  py: number
  title: string
  gross: number
  net: number
  profit: number
  marginPct: number
  swatch: string
}

const MIN_PERIOD_PX = 76
const Y_TICKS = 5

const TOOLTIP_SWATCH_PROFIT = '#66bb6a'
const TOOLTIP_SWATCH_MARGIN = '#f87171'

export function OverlaySalesByChannelPanel({
  data,
  channels,
  channelLabels,
  colorsByChannel,
  grossLabel,
  netLabel,
  tooltipRows,
  barLayout,
  visibilityMenuLabel,
  visibilityMenuTitle,
  visibilityGrossNetOptionLabel,
  visibilityChannelsSectionLabel,
  onSelect,
  seriesVisible,
  heightClassName = 'h-[380px]',
}: OverlaySalesByChannelPanelProps) {
  const metrics = seriesVisible ?? { gross: true, net: true, profit: true, margin: true }
  const { formatCurrency, formatCurrencyCompact } = useCurrency()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverTip | null>(null)
  const [plotContainerWidth, setPlotContainerWidth] = useState(0)
  const [showGrossNetLegend, setShowGrossNetLegend] = useState(true)
  const [hiddenChannels, setHiddenChannels] = useState<Set<SalesChannel>>(() => new Set())

  const padL = 52
  const padR = 12
  const padT = 10
  const padB = 42
  const plotH = 236

  const periodsN = Math.max(data.length, 1)

  const effectiveHidden = useMemo(() => {
    const s = new Set<SalesChannel>()
    for (const c of hiddenChannels) {
      if (channels.includes(c)) s.add(c)
    }
    return s
  }, [channels, hiddenChannels])

  const visibleChannels = useMemo(
    () => channels.filter((c) => !effectiveHidden.has(c)),
    [channels, effectiveHidden],
  )

  const nCh = Math.max(visibleChannels.length, 1)

  const toggleChannelVisibility = (c: SalesChannel) => {
    setHiddenChannels((prev) => {
      const next = new Set(prev)
      const isHidden = next.has(c)
      const visibleCount = channels.filter((x) => !next.has(x)).length
      if (!isHidden && visibleCount <= 1) return prev
      if (isHidden) next.delete(c)
      else next.add(c)
      return next
    })
  }

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setPlotContainerWidth(el.getBoundingClientRect().width)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { W, H, plotW, maxV, yTicks } = useMemo(() => {
    const minPlot = Math.max(320, periodsN * MIN_PERIOD_PX)
    const available =
      plotContainerWidth > 0 ? Math.max(0, plotContainerWidth - padL - padR) : minPlot
    const plotWInner = plotContainerWidth > 0 ? Math.max(minPlot, available) : minPlot
    const Wtotal = padL + plotWInner + padR
    const Htotal = padT + plotH + padB
    let m = 0
    for (const d of data) {
      for (const c of visibleChannels) {
        const g = metrics.gross ? (d.grossByChannel[c] ?? 0) : 0
        const n = metrics.net ? (d.netByChannel[c] ?? 0) : 0
        m = Math.max(m, g, n)
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
  }, [data, visibleChannels, periodsN, plotContainerWidth, padL, padR, padT, padB, plotH, metrics.gross, metrics.net])

  const yScale = (v: number) => padT + plotH - (v / maxV) * plotH
  const zeroY = yScale(0)

  const periodW = plotW / periodsN
  const channelSlotW = periodW / nCh
  const pairW = channelSlotW * 0.88
  const barGap = pairW * 0.12
  const barW = (pairW - barGap) / 2

  const xPairStartGrouped = (periodIdx: number, channelIdx: number) =>
    padL +
    periodIdx * periodW +
    channelIdx * channelSlotW +
    (channelSlotW - pairW) / 2

  const xBarStartStacked = (periodIdx: number, channelIdx: number) =>
    padL +
    periodIdx * periodW +
    channelIdx * channelSlotW +
    (channelSlotW - pairW) / 2

  const showHover = (e: React.PointerEvent, tip: Omit<HoverTip, 'px' | 'py'>) => {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setHover({
      px: e.clientX - r.left + el.scrollLeft,
      py: e.clientY - r.top + el.scrollTop,
      ...tip,
    })
  }

  const moveHover = (e: React.PointerEvent) => {
    setHover((prev) => {
      if (!prev) return prev
      const el = wrapRef.current
      if (!el) return prev
      const r = el.getBoundingClientRect()
      return {
        ...prev,
        px: e.clientX - r.left + el.scrollLeft,
        py: e.clientY - r.top + el.scrollTop,
      }
    })
  }

  const clearHover = () => setHover(null)

  return (
    <div className={cn('flex w-full min-w-0 flex-col', heightClassName)}>
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-0.5">
        {showGrossNetLegend ? (
          <span className="text-[10px] text-text-tertiary">
            <span className="mr-1 inline-block size-2 rounded-sm bg-text-tertiary/40 align-middle" />
            {grossLabel}
            <span className="mx-2 text-text-tertiary/50">·</span>
            <span className="mr-1 inline-block size-2 rounded-sm bg-text-tertiary align-middle" />
            {netLabel}
          </span>
        ) : null}
        {visibleChannels.map((c) => (
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
        <Popover>
          <PopoverTrigger
            className={cn(
              'ml-auto inline-flex h-7 shrink-0 items-center rounded-lg border border-border-subtle bg-white/3 px-2.5 text-[11px] font-medium text-text-secondary transition-colors hover:border-accent/40 hover:bg-accent/8 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
            )}
            aria-label={visibilityMenuTitle}
          >
            {visibilityMenuLabel}
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-[min(100vw-2rem,18rem)] gap-3 border-border-subtle bg-bg-elevated p-3 shadow-xl ring-1 ring-accent/10"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
              {visibilityMenuTitle}
            </p>
            <label className="flex cursor-pointer items-start gap-2.5 text-xs text-text-primary">
              <input
                type="checkbox"
                className="mt-0.5 size-3.5 shrink-0 rounded border-border-subtle accent-accent"
                checked={showGrossNetLegend}
                onChange={(e) => setShowGrossNetLegend(e.target.checked)}
              />
              <span className="leading-snug">{visibilityGrossNetOptionLabel}</span>
            </label>
            <div className="border-t border-border-subtle/80 pt-2">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
                {visibilityChannelsSectionLabel}
              </p>
              <div className="flex flex-col gap-2">
                {channels.map((c) => (
                  <label
                    key={c}
                    className="flex cursor-pointer items-center gap-2.5 text-xs text-text-primary"
                  >
                    <input
                      type="checkbox"
                      className="size-3.5 shrink-0 rounded border-border-subtle accent-accent"
                      checked={!effectiveHidden.has(c)}
                      onChange={() => toggleChannelVisibility(c)}
                    />
                    <span
                      className="inline-flex gap-0.5 rounded-sm border border-border-subtle p-px"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <span
                        className="size-2 rounded-[2px]"
                        style={{ background: colorsByChannel[c], opacity: 0.38 }}
                        aria-hidden
                      />
                      <span
                        className="size-2 rounded-[2px]"
                        style={{ background: colorsByChannel[c], opacity: 1 }}
                        aria-hidden
                      />
                    </span>
                    <span className="font-mono">{channelLabels[c]}</span>
                  </label>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div
        ref={wrapRef}
        className={cn(
          'relative min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden rounded-lg border border-border-subtle/60',
          chartPlotSurfaceClassName,
        )}
        onPointerLeave={clearHover}
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

                {visibleChannels.map((c, cIdx) => {
                  const gross = metrics.gross ? (d.grossByChannel[c] ?? 0) : 0
                  const net = metrics.net ? (d.netByChannel[c] ?? 0) : 0
                  const profit = d.profitByChannel[c] ?? 0
                  const marginPct = d.marginPctByChannel[c] ?? 0
                  const grossY = yScale(gross)
                  const netY = yScale(net)
                  const grossH = Math.max(1, zeroY - grossY)
                  const netH = Math.max(1, zeroY - netY)
                  const color = colorsByChannel[c]
                  const title = `${d.periodLabel} · ${channelLabels[c]}`
                  const tipBase = {
                    title,
                    gross,
                    net,
                    profit,
                    marginPct,
                    swatch: color,
                  }

                  const onClick = () =>
                    onSelect({
                      periodKey: d.periodKey,
                      channel: c,
                      gross,
                      net,
                    })

                  if (barLayout === 'stacked') {
                    if (!metrics.gross && !metrics.net) return null
                    const x0 = xBarStartStacked(pIdx, cIdx)
                    const wFull = pairW
                    let yBottom: number
                    let hBottom: number
                    let yTopSeg: number
                    let hTop: number
                    let opBottom: number
                    let opTop: number

                    if (!metrics.gross && metrics.net) {
                      yBottom = yScale(net)
                      hBottom = zeroY - yBottom
                      yTopSeg = yBottom
                      hTop = 0
                      opBottom = 1
                      opTop = 0
                    } else if (metrics.gross && !metrics.net) {
                      yBottom = yScale(gross)
                      hBottom = zeroY - yBottom
                      yTopSeg = yBottom
                      hTop = 0
                      opBottom = 0.38
                      opTop = 0
                    } else if (gross >= net) {
                      yBottom = yScale(net)
                      hBottom = zeroY - yBottom
                      yTopSeg = yScale(gross)
                      hTop = yBottom - yTopSeg
                      opBottom = 1
                      opTop = 0.38
                    } else {
                      yBottom = yScale(gross)
                      hBottom = zeroY - yBottom
                      yTopSeg = yScale(net)
                      hTop = yBottom - yTopSeg
                      opBottom = 0.38
                      opTop = 1
                    }

                    return (
                      <g
                        key={c}
                        onPointerEnter={(e) => showHover(e, tipBase)}
                        onPointerMove={moveHover}
                        onClick={onClick}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect
                          x={x0}
                          y={yBottom}
                          width={wFull}
                          height={hBottom}
                          rx={3}
                          fill={color}
                          fillOpacity={opBottom}
                        />
                        {hTop > 0.5 ? (
                          <rect
                            x={x0}
                            y={yTopSeg}
                            width={wFull}
                            height={hTop}
                            rx={3}
                            fill={color}
                            fillOpacity={opTop}
                          />
                        ) : null}
                      </g>
                    )
                  }

                  const x0 = xPairStartGrouped(pIdx, cIdx)
                  const xGross = x0
                  const xNet = x0 + barW + barGap

                  return (
                    <g
                      key={c}
                      onPointerEnter={(e) => showHover(e, tipBase)}
                      onPointerMove={moveHover}
                      onClick={onClick}
                      style={{ cursor: 'pointer' }}
                    >
                      {metrics.gross ? (
                        <rect
                          x={xGross}
                          y={grossY}
                          width={barW}
                          height={grossH}
                          rx={3}
                          fill={color}
                          fillOpacity={0.38}
                        />
                      ) : null}
                      {metrics.net ? (
                        <rect
                          x={xNet}
                          y={netY}
                          width={barW}
                          height={netH}
                          rx={3}
                          fill={color}
                          fillOpacity={1}
                        />
                      ) : null}
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>

        {hover ? (
          <div
            className="pointer-events-none absolute z-50 max-w-[min(20rem,calc(100vw-2rem))]"
            style={{
              ...tooltipContentStyle,
              padding: '10px 12px',
              left: hover.px,
              top: hover.py,
              transform: 'translate(-50%, calc(-100% - 10px))',
            }}
          >
            <div
              style={{
                color: 'var(--text-primary)',
                fontWeight: 600,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="inline-block size-2 shrink-0 rounded-sm" style={{ background: hover.swatch }} />
              <span>{hover.title}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  {
                    label: tooltipRows.gross,
                    value: formatCurrency(hover.gross),
                    swatch: { kind: 'channel' as const, opacity: 0.38 },
                    show: metrics.gross,
                  },
                  {
                    label: tooltipRows.net,
                    value: formatCurrency(hover.net),
                    swatch: { kind: 'channel' as const, opacity: 1 },
                    show: metrics.net,
                  },
                  {
                    label: tooltipRows.profit,
                    value: formatCurrency(hover.profit),
                    swatch: { kind: 'fixed' as const, color: TOOLTIP_SWATCH_PROFIT },
                    show: metrics.profit,
                  },
                  {
                    label: tooltipRows.margin,
                    value: `${hover.marginPct.toFixed(1)}%`,
                    swatch: { kind: 'fixed' as const, color: TOOLTIP_SWATCH_MARGIN },
                    show: metrics.margin,
                  },
                ] as const
              ).filter((row) => row.show).map((row) => (
                <div key={row.label} className="flex justify-between gap-6 text-[12px] leading-snug">
                  <span className="flex min-w-0 items-center gap-2 text-text-secondary">
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-sm border border-white/10"
                      style={
                        row.swatch.kind === 'channel'
                          ? { background: hover.swatch, opacity: row.swatch.opacity }
                          : { background: row.swatch.color }
                      }
                      aria-hidden
                    />
                    {row.label}
                  </span>
                  <span className="tabular-nums text-text-primary">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
