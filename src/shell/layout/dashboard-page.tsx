import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export const pageTitleClassName =
  'text-2xl font-semibold tracking-[-0.02em] text-text-primary'

export const pageSubtitleClassName =
  'max-w-2xl text-xs leading-relaxed text-text-secondary'

type DashboardPageProps = {
  children: ReactNode
  className?: string
}

export function DashboardPage({ children, className }: DashboardPageProps) {
  return (
    <div className={cn('w-full', className)}>{children}</div>
  )
}
