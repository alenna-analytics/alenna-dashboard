import { Line, LineChart, ResponsiveContainer } from 'recharts'

import { useTheme } from '@/components/providers/theme-provider'
import { cn } from '@/lib/utils'

type KpiSparklineProps = {
  data: number[]
  className?: string
}

export function KpiSparkline({ data, className }: KpiSparklineProps) {
  const { theme } = useTheme()
  const stroke = theme === 'dark' ? '#8b5cf6' : '#7c3aed'
  const chartData = data.map((v, i) => ({ i, v }))

  if (chartData.length < 2) {
    return <div className={cn('h-8 w-full', className)} aria-hidden />
  }

  return (
    <div className={cn('h-8 w-full min-w-0', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
