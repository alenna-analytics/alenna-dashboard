import type { CSSProperties } from 'react'

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
] as const

export const chartMargins = { top: 20, right: 14, left: 6, bottom: 12 }

export const cartesianGridProps = {
  strokeDasharray: '3 10' as const,
  stroke: 'var(--chart-grid)',
  strokeOpacity: 0.45,
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
  background: 'var(--card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '10px',
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
}
