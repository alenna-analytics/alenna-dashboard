import type { ReactNode } from 'react'
import { BarChart3, LineChart, PieChart } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

export type SeriesChartView = 'line' | 'bar'
export type ShareChartView = 'bar' | 'pie'

export type ChartViewToggleOption<T extends string> = {
  value: T
  label: string
  icon: ReactNode
}

type ChartViewToggleGroupProps<T extends string> = {
  value: T
  options: readonly ChartViewToggleOption<T>[]
  onChange: (next: T) => void
}

export function ChartViewToggleGroup<T extends string>({
  value,
  options,
  onChange,
}: ChartViewToggleGroupProps<T>) {
  const currentIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const current = options[currentIndex] ?? options[0]
  const next = options[(currentIndex + 1) % options.length] ?? current
  if (!current || !next) return null

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={next.label}
        onClick={() => onChange(next.value)}
        className={cn(
          'inline-flex size-7 items-center justify-center rounded-md border border-border-default bg-white text-text-secondary transition-colors',
          'hover:bg-muted hover:text-text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
        )}
      >
        {current.icon}
      </TooltipTrigger>
      <TooltipContent side="bottom">{next.label}</TooltipContent>
    </Tooltip>
  )
}

type SeriesChartViewToggleProps = {
  value: SeriesChartView
  onChange: (next: SeriesChartView) => void
  lineLabel: string
  barLabel: string
}

export function SeriesChartViewToggle({
  value,
  onChange,
  lineLabel,
  barLabel,
}: SeriesChartViewToggleProps) {
  return (
    <ChartViewToggleGroup
      value={value}
      onChange={onChange}
      options={[
        {
          value: 'line',
          label: lineLabel,
          icon: <LineChart className="size-3.5" strokeWidth={1.75} aria-hidden />,
        },
        {
          value: 'bar',
          label: barLabel,
          icon: <BarChart3 className="size-3.5" strokeWidth={1.75} aria-hidden />,
        },
      ]}
    />
  )
}

type ShareChartViewToggleProps = {
  value: ShareChartView
  onChange: (next: ShareChartView) => void
  barLabel: string
  pieLabel: string
}

export function ShareChartViewToggle({
  value,
  onChange,
  barLabel,
  pieLabel,
}: ShareChartViewToggleProps) {
  return (
    <ChartViewToggleGroup
      value={value}
      onChange={onChange}
      options={[
        {
          value: 'bar',
          label: barLabel,
          icon: <BarChart3 className="size-3.5" strokeWidth={1.75} aria-hidden />,
        },
        {
          value: 'pie',
          label: pieLabel,
          icon: <PieChart className="size-3.5" strokeWidth={1.75} aria-hidden />,
        },
      ]}
    />
  )
}
