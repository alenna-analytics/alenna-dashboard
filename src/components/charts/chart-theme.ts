import type { CSSProperties } from 'react'

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
] as const

export const chartMargins = { top: 8, right: 8, left: 0, bottom: 0 }

export const cartesianGridProps = {
  strokeDasharray: '3 3' as const,
  stroke: 'var(--chart-grid)',
  vertical: false,
}

export const xAxisProps = {
  tick: {
    fill: 'var(--text-tertiary)',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
  },
  axisLine: false,
  tickLine: false,
}

export const yAxisProps = {
  tick: {
    fill: 'var(--text-tertiary)',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
  },
  axisLine: false,
  tickLine: false,
}

export const tooltipContentStyle: CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
}
