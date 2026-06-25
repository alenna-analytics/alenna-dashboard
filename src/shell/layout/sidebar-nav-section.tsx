import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type SidebarNavSectionProps = {
  collapsed: boolean
  sectionLabel: string
  children: ReactNode
  className?: string
}

export function SidebarNavSection({
  collapsed,
  sectionLabel,
  children,
  className,
}: SidebarNavSectionProps) {
  return (
    <div
      role="group"
      aria-label={sectionLabel}
      className={cn('flex flex-col gap-1', className)}
    >
      <div
        role="presentation"
        aria-hidden
        className={cn(
          'shrink-0 border-t border-[var(--shell-structure-border)]',
          collapsed ? 'mx-auto my-2 w-6' : 'mx-2 mt-0 mb-1',
        )}
      />
      {children}
    </div>
  )
}
