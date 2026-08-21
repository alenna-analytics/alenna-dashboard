import { useMemo, useState } from 'react'
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatCompactNumber } from '@/lib/format/compact-number'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ChannelBreakdownRow } from '@/lib/types/reports'
import { cn } from '@/lib/utils'
import { SectionHeader } from '@/pages/reports/report-ui'
import { ChartTooltipFrame } from '@/ui/chart-tooltip'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'
import { TOP_PRODUCTS_PAIRED_MIN_HEIGHT_CLASS } from '@/pages/dashboard/home-top-products-chart-layout'

const TOP_N = 5

const CHANNEL_PALETTE = [
  'var(--chart-1)',
  'var(--chart-3)',
  'var(--chart-2)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--text-tertiary)',
] as const

export type ChannelChartType = 'bar' | 'pie'

export type HomeChannelDonutChartProps = {
  rows: ChannelBreakdownRow[]
  convertValue: (value: number) => number
  formatValue: (value: number) => string
  formatCompact?: (value: number) => string
  t: (key: ShellStringKey) => string
  minBodyHeightPx?: number
  isLoading?: boolean
  valueKey?: 'gross_revenue' | 'net_revenue'
  heightClassName?: string
  chartType?: ChannelChartType
}

type ChartRow = {
  key: string
  label: string
  value: number
  fill: string
}

type TooltipPayload = {
  payload?: ChartRow
}

function platformLabel(platform: string): string {
  const trimmed = platform.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function rowLabel(row: ChannelBreakdownRow): string {
  return platformLabel(row.platform) || row.connection_id
}

function ChannelTooltip({
  active,
  payload,
  formatValue,
  total,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  formatValue: (value: number) => string
  total: number
}) {
  if (!active || !payload?.[0]?.payload) return null
  const row = payload[0].payload
  const pct = total > 0 ? Math.round((row.value / total) * 100) : 0
  return (
    <ChartTooltipFrame>
      <p className="font-medium text-white">{row.label}</p>
      <p className="mt-0.5 tabular-nums text-white/70">
        {formatValue(row.value)} · {pct}%
      </p>
    </ChartTooltipFrame>
  )
}

type ChannelChartTypeToggleProps = {
  value: ChannelChartType
  onChange: (next: ChannelChartType) => void
  t: (key: ShellStringKey) => string
}

function ChannelChartTypeToggle({ value, onChange, t }: ChannelChartTypeToggleProps) {
  const next: ChannelChartType = value === 'bar' ? 'pie' : 'bar'
  const label = next === 'pie' ? t('homeChannelChartViewPie') : t('homeChannelChartViewBar')
  return (
    <UiTooltip>
      <TooltipTrigger
        type="button"
        aria-label={label}
        onClick={() => onChange(next)}
        className={cn(
          'inline-flex size-7 items-center justify-center rounded-md border border-border-default bg-white text-text-secondary transition-colors',
          'hover:bg-muted hover:text-text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
        )}
      >
        {value === 'bar' ? (
          <BarChart3 className="size-3.5" strokeWidth={1.75} aria-hidden />
        ) : (
          <PieChartIcon className="size-3.5" strokeWidth={1.75} aria-hidden />
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </UiTooltip>
  )
}

export function HomeChannelShareSection({
  title,
  description,
  t,
  ...chartProps
}: HomeChannelDonutChartProps & {
  title: string
  description: string
}) {
  const [chartType, setChartType] = useState<ChannelChartType>('bar')
  return (
    <>
      <SectionHeader
        title={title}
        description={description}
        aside={<ChannelChartTypeToggle value={chartType} onChange={setChartType} t={t} />}
      />
      <HomeChannelDonutChart {...chartProps} t={t} chartType={chartType} />
    </>
  )
}

export function HomeChannelDonutChart({
  rows,
  convertValue,
  formatValue,
  formatCompact,
  t,
  minBodyHeightPx,
  isLoading = false,
  valueKey = 'net_revenue',
  heightClassName = 'h-40',
  chartType = 'bar',
}: HomeChannelDonutChartProps) {
  const chartRows = useMemo<ChartRow[]>(() => {
    const sorted = [...rows].sort((a, b) => b[valueKey] - a[valueKey])
    const head = sorted.slice(0, TOP_N).map((r, index) => ({
      key: r.connection_id,
      label: rowLabel(r),
      value: convertValue(r[valueKey]),
      fill: CHANNEL_PALETTE[index % CHANNEL_PALETTE.length],
    }))
    const tail = sorted.slice(TOP_N)
    if (tail.length > 0) {
      head.push({
        key: '__overflow__',
        label: t('homeChannelDonutOther'),
        value: tail.reduce((acc, r) => acc + convertValue(r[valueKey]), 0),
        fill: CHANNEL_PALETTE[head.length % CHANNEL_PALETTE.length],
      })
    }
    return head.filter((s) => s.value > 0)
  }, [rows, convertValue, t, valueKey])

  const total = useMemo(
    () => chartRows.reduce((acc, row) => acc + row.value, 0),
    [chartRows],
  )
  const compactTotal = formatCompact
    ? formatCompact(total)
    : formatCompactNumber(total, 0)

  const frameClassName = cn(
    'w-full min-w-0',
    heightClassName,
    minBodyHeightPx !== undefined && TOP_PRODUCTS_PAIRED_MIN_HEIGHT_CLASS,
  )

  if (isLoading && chartRows.length === 0) {
    return <Skeleton className={frameClassName} aria-hidden />
  }

  if (!isLoading && (chartRows.length === 0 || total === 0)) {
    return <EmptyState size="sm" icon="home" title={t('homeChannelDonutEmpty')} />
  }

  if (chartType === 'pie') {
    return (
      <div className={cn(frameClassName, 'flex flex-col')}>
        <div className="relative min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartRows}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={1.5}
                stroke="var(--background)"
                strokeWidth={1}
                isAnimationActive={false}
              >
                {chartRows.map((row) => (
                  <Cell key={row.key} fill={row.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChannelTooltip formatValue={formatValue} total={total} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[11px] text-text-tertiary">{t('homeChannelDonutCenterLabel')}</p>
            <p className="text-sm font-semibold tabular-nums text-text-primary">{compactTotal}</p>
          </div>
        </div>
        <ul className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
          {chartRows.map((row) => (
            <li key={row.key} className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="size-2 shrink-0 rounded-sm" style={{ background: row.fill }} aria-hidden />
              {row.label}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className={frameClassName}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartRows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
          />
          <YAxis
            width={44}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            tickFormatter={(value: number) => formatCompactNumber(Number(value), 0)}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.45 }}
            content={<ChannelTooltip formatValue={formatValue} total={total} />}
          />
          <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={18} isAnimationActive={false}>
            {chartRows.map((row) => (
              <Cell key={row.key} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
