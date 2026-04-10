import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type DashboardPageProps = {
  children: ReactNode
  className?: string
}

export function DashboardPage({ children, className }: DashboardPageProps) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl', className)}>{children}</div>
  )
}
