import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type DashboardPageProps = {
  children: ReactNode
  className?: string
}

export function DashboardPage({ children, className }: DashboardPageProps) {
  return (
    <div className={cn('w-full', className)}>{children}</div>
  )
}
