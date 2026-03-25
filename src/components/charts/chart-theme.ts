import type { CSSProperties } from 'react'

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
] as const

export const chartMargins = { top: 16, right: 12, left: 4, bottom: 8 }

export const cartesianGridProps = {
  strokeDasharray: '3 8' as const,
  stroke: 'var(--chart-grid)',
  strokeOpacity: 0.65,
  vertical: false,
}

export const xAxisProps = {
  tick: {
    fill: 'var(--text-tertiary)',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
  },
  axisLine: false,
  tickLine: false,
}

export const yAxisProps = {
  tick: {
    fill: 'var(--text-tertiary)',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
  },
  axisLine: false,
  tickLine: false,
}

export const tooltipContentStyle: CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '10px',
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
}
