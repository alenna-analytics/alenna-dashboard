import { cn } from '@/lib/utils'

type DeltaBadgeProps = {
  value: string
  positive?: boolean
  className?: string
}

export function DeltaBadge({ value, positive, className }: DeltaBadgeProps) {
  return (
    <span
      className={cn(
        positive ? 'delta-positive' : 'delta-negative',
        className
      )}
    >
      {positive ? '↑' : '↓'} {value}
    </span>
  )
}
