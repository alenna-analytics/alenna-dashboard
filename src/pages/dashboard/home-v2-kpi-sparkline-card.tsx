import type { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

import { cn } from '@/lib/utils'
import { KpiDeltaPill } from '@/ui/kpi-card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

type PctTrend = 'up' | 'down' | 'flat'

export type HomeV2KpiSparklineCardProps = {
  label: string
  helpText?: string
  value: string
  currencyCode?: string
  pct: number | null
  trend: PctTrend
  comparisonUnavailable: boolean
  negativeMetric?: boolean
  deltaTooltip?: string
  placeholder?: boolean
  placeholderLabel?: string
  sparklineValues?: number[]
  sparklineId: string
  dragHandle?: ReactNode
  className?: string
}

export function HomeV2KpiSparklineCard({
  label,
  helpText,
  value,
  currencyCode,
  pct,
  trend,
  comparisonUnavailable,
  negativeMetric,
  deltaTooltip,
  placeholder = false,
  placeholderLabel = '—',
  sparklineValues = [],
  sparklineId,
  dragHandle,
  className,
}: HomeV2KpiSparklineCardProps) {
  const sparkData = sparklineValues.map((v, index) => ({ index, v }))
  const gradientId = `home-v2-spark-${sparklineId}`

  return (
    <article
      data-kpi-card-shell
      className={cn(
        'flex min-h-[148px] min-w-0 flex-col rounded-md border border-border-default bg-white p-4',
        placeholder && 'opacity-80',
        className,
      )}
    >
      <div className="flex w-full min-w-0 items-start gap-1.5">
        {dragHandle}
        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <span className="min-w-0 text-sm font-medium leading-tight text-text-primary">{label}</span>
          {helpText ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-text-secondary"
                aria-label={helpText}
              >
                <HelpCircle className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-left text-xs font-normal leading-snug">
              {helpText}
            </TooltipContent>
          </Tooltip>
        ) : null}
        </div>
      </div>

      <div className="mt-2 flex min-w-0 items-baseline justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="font-numeric text-xl font-semibold leading-none tracking-tight text-text-primary">
            {placeholder ? placeholderLabel : value}
          </span>
          {!placeholder && currencyCode ? (
            <span className="text-sm font-medium text-text-secondary">{currencyCode}</span>
          ) : null}
        </div>
        {!placeholder ? (
          deltaTooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex shrink-0 cursor-default">
                  <KpiDeltaPill
                    pct={pct}
                    trend={trend}
                    comparisonUnavailable={comparisonUnavailable}
                    negativeMetric={negativeMetric}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[260px] text-left text-xs font-normal leading-snug">
                {deltaTooltip}
              </TooltipContent>
            </Tooltip>
          ) : (
            <KpiDeltaPill
              pct={pct}
              trend={trend}
              comparisonUnavailable={comparisonUnavailable}
              negativeMetric={negativeMetric}
            />
          )
        ) : null}
      </div>

      <div className="mt-auto h-14 w-full min-w-0 pt-2">
        {sparkData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--firefly-base)" />
                  <stop offset="100%" stopColor="var(--zara-base)" />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={`url(#${gradientId})`}
                fill="none"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full rounded-sm bg-muted/20" aria-hidden />
        )}
      </div>
    </article>
  )
}
