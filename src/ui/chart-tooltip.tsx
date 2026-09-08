/* eslint-disable react-refresh/only-export-components -- shared tooltip tokens + frame */
import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Soft white chart hover tooltip (matches shell `--bg-base`). */
export const CHART_TOOLTIP_BG = '#fefefe'

export const chartTooltipFrameClassName =
  'rounded-xl border-0 bg-white px-3 py-2.5 text-xs font-normal text-text-primary shadow-[0_8px_24px_rgba(15,23,42,0.12)]'

export const chartTooltipContentStyle: CSSProperties = {
  background: CHART_TOOLTIP_BG,
  border: 'none',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
  color: 'var(--text-primary)',
  fontSize: 12,
}

export const chartTooltipItemStyle: CSSProperties = { color: 'var(--text-primary)' }
export const chartTooltipLabelStyle: CSSProperties = { color: 'var(--text-primary)' }

export const chartRechartsTooltipProps = {
  allowEscapeViewBox: { x: true, y: true } as const,
  offset: 16,
  wrapperStyle: { outline: 'none', zIndex: 40 } as const,
  contentStyle: {
    margin: 0,
    padding: 0,
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    boxShadow: 'none',
  } as const,
}

export function ChartTooltipFrame({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn(chartTooltipFrameClassName, className)}>{children}</div>
}

export function ChartTooltipTitle({ children }: { children: ReactNode }) {
  return <p className="mb-1.5 text-[13px] font-semibold text-text-primary">{children}</p>
}

/** Series row: color dot + label + gray value badge (img 3). */
export function ChartTooltipSeriesRow({
  color,
  label,
  value,
}: {
  color?: string
  label: ReactNode
  value: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 py-0.5">
      <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
        {color ? (
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: color }}
            aria-hidden
          />
        ) : null}
        <span className="min-w-0 truncate">{label}</span>
      </div>
      <span className="inline-flex w-fit max-w-full rounded-md bg-muted px-1.5 py-0.5 text-[12px] font-medium tabular-nums text-text-primary">
        {value}
      </span>
    </div>
  )
}

/** Title-hover calc tooltip (img 2): title + description + formula with green terms. */
export function MetricCalcTooltipBody({
  title,
  description,
  formulaLeft,
  formulaParts,
  formulaJoiner = ' + ',
}: {
  title: string
  description?: string
  formulaLeft?: string
  formulaParts?: readonly string[]
  /** Between green terms; default + for calc formulas. */
  formulaJoiner?: string
}) {
  return (
    <div className="max-w-[22rem] space-y-1.5 text-left">
      <p className="text-[13px] font-semibold text-text-primary">{title}</p>
      {description ? (
        <p className="text-[12px] leading-snug text-text-secondary">{description}</p>
      ) : null}
      {formulaLeft && formulaParts && formulaParts.length > 0 ? (
        <p className="font-mono text-[11px] leading-relaxed">
          <span className="text-text-primary">{formulaLeft}</span>
          {formulaParts.map((part, index) => (
            <span key={`${part}-${index}`}>
              {index > 0 ? <span className="text-text-tertiary">{formulaJoiner}</span> : null}
              <span className="text-emerald-700">{part}</span>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  )
}
