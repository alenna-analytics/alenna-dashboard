/* eslint-disable react-refresh/only-export-components -- shared tooltip tokens + frame */
import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Same fill as Radix `TooltipContent` / toast. */
export const CHART_TOOLTIP_BG = '#1f1f1f'

export const chartTooltipFrameClassName =
  'rounded-xl border-0 bg-[#1f1f1f] px-3 py-2 text-xs font-normal text-white shadow-lg'

export const chartTooltipContentStyle: CSSProperties = {
  background: CHART_TOOLTIP_BG,
  border: 'none',
  borderRadius: 12,
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.25)',
  color: '#fff',
  fontSize: 12,
}

export const chartTooltipItemStyle: CSSProperties = { color: '#fff' }
export const chartTooltipLabelStyle: CSSProperties = { color: '#fff' }

export function ChartTooltipFrame({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn(chartTooltipFrameClassName, className)}>{children}</div>
}
