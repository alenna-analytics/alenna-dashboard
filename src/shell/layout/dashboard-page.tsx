import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export const pageTitleClassName =
  'text-2xl font-semibold tracking-[-0.02em] text-text-primary'

type DashboardPageProps = {
  children: ReactNode
  className?: string
}

export function DashboardPage({ children, className }: DashboardPageProps) {
  return (
    <div className={cn('w-full', className)}>{children}</div>
  )
}
