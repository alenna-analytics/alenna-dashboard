import { useEffect, useMemo, useState } from 'react'
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  CHART_LINE_MAIN_MS,
  CHART_LINE_MINI_MS,
  useChartLineLoadAnimation,
} from '@/pages/dashboard/use-chart-line-load-animation'
import { cn } from '@/lib/utils'
import { fmtCurrency } from '@/pages/reports/reports-ui-helpers'

import type {
  ProductCostPriceChartPoint,
  ProductCostPriceChartSeries,
} from './product-cost-chart-points'

const GRID = 'var(--color-chart-grid)'
const TICK_STYLE = { fill: 'var(--color-text-tertiary)', fontSize: 11, fontFamily: 'var(--font-numeric)' }

function addDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d + deltaDays)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function ChartTooltip({
  active,
  payload,
  seriesByKey,
  t,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ dataKey?: string; value?: number; stroke?: string }>
  seriesByKey: Record<string, ProductCostPriceChartSeries>
  t: (key: ShellStringKey) => string
}) {
  if (!active || !payload?.length) return null
  const row = (payload[0] as unknown as { payload?: ProductCostPriceChartPoint })?.payload
  if (!row) return null
  return (
    <div className="rounded-md border border-border-subtle bg-popover px-3 py-2 text-xs shadow-[var(--shadow-popover)]">
      <div className="font-medium text-text-primary">
        {t('productsDetailChartTooltipDate')}:{' '}
        <span className="font-numeric tabular-nums">{row.dateKey}</span>
      </div>
      <div className="mt-1 space-y-0.5">
        {payload.map((p) => {
          const key = String(p.dataKey || '').replace(/^values\./, '')
          const series = seriesByKey[key]
          if (!series) return null
          return (
            <div key={key} className="flex items-center gap-2 text-text-secondary">
              <span className="inline-block size-2 rounded-full" style={{ background: p.stroke }} />
              <span>{series.label}:</span>
              <span className="font-numeric tabular-nums">
                {fmtCurrency(Number(p.value ?? 0), series.currency)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export type ProductCostOverTimeChartProps = {
  data: ProductCostPriceChartPoint[]
  series: ProductCostPriceChartSeries[]
  className?: string
  t: (key: ShellStringKey) => string
}

export function ProductCostOverTimeChart({ data, series, className, t }: ProductCostOverTimeChartProps) {
  const [hiddenKeys, setHiddenKeys] = useState<Record<string, boolean>>({})
  const [zoomStart, setZoomStart] = useState(0)
  const [zoomEnd, setZoomEnd] = useState(Math.max(0, data.length - 1))
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (data.length === 0) {
        setZoomStart(0)
        setZoomEnd(0)
        return
      }
      const today = data[data.length - 1]?.dateKey
      const startYmd = today ? addDaysYmd(today, -29) : data[0]?.dateKey
      const startIdx = Math.max(
        0,
        data.findIndex((p) => p.dateKey >= startYmd),
      )
      setZoomStart(startIdx === -1 ? 0 : startIdx)
      setZoomEnd(data.length - 1)
    }, 0)
    return () => window.clearTimeout(id)
  }, [data])

  const chartResetKey = useMemo(() => {
    if (data.length === 0) {
      return `empty:${series.map((s) => s.key).join('|')}`
    }
    const meta = series.map((s) => `${s.key}:${s.currency}:${s.kind}`).join('|')
    const sig = data
      .map((p) => {
        const vals = series.map((s) => String(p.values[s.key] ?? '')).join(',')
        return `${p.dateKey}:${vals}`
      })
      .join(';')
    return `${meta}#${sig}`
  }, [data, series])

  const lineLoadAnim = useChartLineLoadAnimation(chartResetKey, CHART_LINE_MAIN_MS)

  const dataWithIndex = useMemo(
    () => data.map((d, i) => ({ ...d, __idx: i })),
    [data],
  )
  const visibleData = useMemo(() => {
    if (dataWithIndex.length === 0) return dataWithIndex
    const start = Math.max(0, Math.min(zoomStart, dataWithIndex.length - 1))
    const end = Math.max(start, Math.min(zoomEnd, dataWithIndex.length - 1))
    return dataWithIndex.slice(start, end + 1)
  }, [dataWithIndex, zoomStart, zoomEnd])

  if (data.length === 0) {
    return (
      <div
        className={cn(
          'flex min-h-[14rem] items-center justify-center rounded-md border border-dashed border-border-subtle bg-muted/30 px-4 text-center text-sm text-text-secondary',
          className,
        )}
      >
        {t('productsDetailChartEmpty')}
      </div>
    )
  }
  const seriesByKey = Object.fromEntries(series.map((s) => [s.key, s]))

  const handleLegendClick = (entry: {
    dataKey?: string
    id?: string
    payload?: { id?: string; dataKey?: string }
  }) => {
    const raw =
      entry.id || entry.dataKey || entry.payload?.id || entry.payload?.dataKey || ''
    const key = String(raw).replace(/^values\./, '')
    if (!key) return
    setHiddenKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleZoomIn = () => {
    const span = zoomEnd - zoomStart + 1
    if (span <= 6) return
    const nextSpan = Math.max(6, Math.floor(span * 0.6))
    const center = Math.floor((zoomStart + zoomEnd) / 2)
    const start = Math.max(0, center - Math.floor(nextSpan / 2))
    const end = Math.min(data.length - 1, start + nextSpan - 1)
    setZoomStart(start)
    setZoomEnd(end)
  }

  const handleZoomOut = () => {
    const span = zoomEnd - zoomStart + 1
    if (span >= data.length) return
    const nextSpan = Math.min(data.length, Math.ceil(span * 1.5))
    const center = Math.floor((zoomStart + zoomEnd) / 2)
    const start = Math.max(0, center - Math.floor(nextSpan / 2))
    const end = Math.min(data.length - 1, start + nextSpan - 1)
    setZoomStart(start)
    setZoomEnd(end)
  }

  return (
    <div
      className={cn(
        'min-h-[14rem] w-full [&_.recharts-surface:focus]:outline-none [&_.recharts-layer:focus]:outline-none [&_.recharts-wrapper:focus]:outline-none [&_.recharts-brush-traveller:focus]:outline-none',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-end gap-2">
        <button
          type="button"
          className="rounded border border-border-subtle px-2 py-1 text-xs text-text-secondary outline-none hover:bg-muted/40 focus:outline-none"
          onClick={handleZoomOut}
        >
          -
        </button>
        <button
          type="button"
          className="rounded border border-border-subtle px-2 py-1 text-xs text-text-secondary outline-none hover:bg-muted/40 focus:outline-none"
          onClick={handleZoomIn}
        >
          +
        </button>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={visibleData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="dateKey"
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border-subtle)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            width={56}
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border-subtle)' }}
            tickFormatter={(v) =>
              typeof v === 'number' && Number.isFinite(v)
                ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v)
                : ''
            }
          />
          <Tooltip
            content={<ChartTooltip t={t} seriesByKey={seriesByKey} />}
            cursor={{ stroke: 'var(--color-border-default)' }}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="stepAfter"
              dataKey={`values.${s.key}`}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.kind === 'channel' ? '6 4' : undefined}
              dot={false}
              activeDot={{ r: 4 }}
              opacity={hiddenKeys[s.key] ? 0.18 : 1}
              isAnimationActive={lineLoadAnim}
              animationDuration={CHART_LINE_MAIN_MS}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 rounded border border-border-subtle/70 bg-white px-1 py-1">
        <div className="relative h-16 w-full">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataWithIndex} margin={{ top: 4, right: 4, left: 4, bottom: 2 }}>
                <XAxis dataKey="dateKey" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <ReferenceArea
                  x1={dataWithIndex[Math.max(0, Math.min(zoomStart, dataWithIndex.length - 1))]?.dateKey}
                  x2={dataWithIndex[Math.max(0, Math.min(zoomEnd, dataWithIndex.length - 1))]?.dateKey}
                  fill="rgba(0,0,0,0.18)"
                  stroke="rgba(0,0,0,0.32)"
                  strokeWidth={1}
                  ifOverflow="extendDomain"
                />
                {series.map((s) => (
                  <Line
                    key={`overview-${s.key}`}
                    type="stepAfter"
                    dataKey={`values.${s.key}`}
                    stroke={s.color}
                    strokeWidth={1.5}
                    strokeDasharray={s.kind === 'channel' ? '4 3' : undefined}
                    dot={false}
                    isAnimationActive={lineLoadAnim}
                    animationDuration={CHART_LINE_MINI_MS}
                    animationEasing="ease-out"
                    opacity={hiddenKeys[s.key] ? 0.2 : 0.9}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataWithIndex} margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
                <XAxis dataKey="__idx" hide />
                <YAxis hide />
                <Brush
                  dataKey="__idx"
                  height={62}
                  travellerWidth={8}
                  stroke="var(--color-border-default)"
                  fill="transparent"
                  startIndex={zoomStart}
                  endIndex={zoomEnd}
                  onChange={(r) => {
                    if (typeof r?.startIndex === 'number') setZoomStart(r.startIndex)
                    if (typeof r?.endIndex === 'number') setZoomEnd(r.endIndex)
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {series.map((s) => {
          const hidden = Boolean(hiddenKeys[s.key])
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => handleLegendClick({ id: s.key })}
              className={cn(
                'inline-flex items-center gap-1.5 transition-opacity outline-none focus:outline-none',
                hidden ? 'opacity-40' : 'opacity-100',
              )}
            >
              <span
                className="inline-block h-0.5 w-4 rounded"
                style={{
                  background: s.color,
                  borderTop:
                    s.kind === 'channel' ? `2px dashed ${s.color}` : `2px solid ${s.color}`,
                }}
              />
              <span>{s.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
