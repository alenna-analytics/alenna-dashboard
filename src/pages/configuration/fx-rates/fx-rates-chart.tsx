import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { es as esLocale } from 'date-fns/locale/es'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { Language } from '@/shell/providers/language-provider'
import { ChartTooltipFrame } from '@/ui/chart-tooltip'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'

import { fxPairKey, parseFxRate, type FxRateRow } from './fx-rates-types'

type FxRatesChartProps = {
  rows: FxRateRow[]
  pair: string
  lang: Language
  isLoading?: boolean
  isError?: boolean
}

type ChartPoint = {
  date: string
  label: string
  rate: number
  pair: string
}

type TooltipPayload = {
  payload?: ChartPoint
}

function RateTooltip({
  active,
  payload,
  t,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  t: (key: ShellStringKey) => string
}) {
  if (!active || !payload?.[0]?.payload) return null
  const row = payload[0].payload
  return (
    <ChartTooltipFrame>
      <p className="font-medium text-white">{row.label}</p>
      <p className="mt-0.5 text-white/70">
        {row.pair}: {row.rate.toLocaleString(undefined, { maximumFractionDigits: 6 })}
      </p>
      <p className="mt-0.5 text-white/55">{t('workspaceConfigFxRatesColRate')}</p>
    </ChartTooltipFrame>
  )
}

export function FxRatesChart({
  rows,
  pair,
  lang,
  isLoading = false,
  isError = false,
}: FxRatesChartProps) {
  const dateLocale = lang === 'en' ? enUS : esLocale
  const t = (key: ShellStringKey) => shellT(lang, key)

  const points = useMemo<ChartPoint[]>(() => {
    const filtered = rows
      .filter((row) => fxPairKey(row) === pair)
      .map((row) => {
        const rate = parseFxRate(row.rate)
        if (rate === null) return null
        const day = parseISO(row.rate_date)
        return {
          date: row.rate_date,
          label: format(day, 'd MMM', { locale: dateLocale }),
          rate,
          pair,
        }
      })
      .filter((row): row is ChartPoint => row !== null)
    return filtered.sort((a, b) => a.date.localeCompare(b.date))
  }, [dateLocale, pair, rows])

  if (isLoading) {
    return <Skeleton className="h-52 w-full" aria-hidden />
  }

  if (isError) {
    return (
      <div className="rounded-md border border-border-subtle">
        <EmptyState size="sm" icon="billing" title={t('workspaceConfigFxRatesLoadFailed')} />
      </div>
    )
  }

  if (!pair || points.length === 0) {
    return (
      <div className="rounded-md border border-border-subtle">
        <EmptyState size="sm" icon="billing" title={t('workspaceConfigFxRatesChartEmpty')} />
      </div>
    )
  }

  return (
    <div className="h-52 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={28}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
          />
          <YAxis
            width={48}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            tickFormatter={(value: number) =>
              Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
            }
          />
          <Tooltip
            cursor={{ stroke: 'var(--border-subtle)', strokeDasharray: '4 4' }}
            content={<RateTooltip t={t} />}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--chart-1)' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
