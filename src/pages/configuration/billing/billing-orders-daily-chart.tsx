import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { es as esLocale } from 'date-fns/locale/es'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { BillingOrdersDailyPoint } from '@/lib/billing/billing-api'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { Language } from '@/shell/providers/language-provider'
import { ChartTooltipFrame } from '@/ui/chart-tooltip'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'

type BillingOrdersDailyChartProps = {
  points: BillingOrdersDailyPoint[]
  lang: Language
  isLoading?: boolean
  isError?: boolean
}

type ChartRow = {
  date: string
  label: string
  orders: number
}

type TooltipPayload = {
  payload?: ChartRow
}

function DailyTooltip({
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
        {t('billingOrdersDailyTooltip')}: {row.orders}
      </p>
    </ChartTooltipFrame>
  )
}

export function BillingOrdersDailyChart({
  points,
  lang,
  isLoading = false,
  isError = false,
}: BillingOrdersDailyChartProps) {
  const dateLocale = lang === 'en' ? enUS : esLocale
  const t = (key: ShellStringKey) => shellT(lang, key)
  const rows = useMemo<ChartRow[]>(
    () =>
      points.map((point) => {
        const day = parseISO(point.date)
        return {
          date: point.date,
          label: format(day, 'd MMM', { locale: dateLocale }),
          orders: point.orders,
        }
      }),
    [dateLocale, points],
  )
  const hasOrders = rows.some((row) => row.orders > 0)

  if (isLoading) {
    return <Skeleton className="h-40 w-full" aria-hidden />
  }

  if (isError) {
    return (
      <div className="rounded-md border border-border-subtle">
        <EmptyState size="sm" icon="billing" title={t('billingOrdersDailyError')} />
      </div>
    )
  }

  if (!hasOrders) {
    return (
      <div className="rounded-md border border-border-subtle">
        <EmptyState size="sm" icon="billing" title={t('billingOrdersDailyEmpty')} />
      </div>
    )
  }

  return (
    <div className="h-40 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={28}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            width={36}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.45 }}
            content={<DailyTooltip t={t} />}
          />
          <Bar
            dataKey="orders"
            fill="var(--chart-3)"
            radius={[2, 2, 0, 0]}
            maxBarSize={18}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
