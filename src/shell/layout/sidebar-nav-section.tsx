import { useId, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type SidebarNavSectionProps = {
  collapsed: boolean
  sectionTitle: string
  children: ReactNode
  className?: string
}

export function SidebarNavSection({
  collapsed,
  sectionTitle,
  children,
  className,
}: SidebarNavSectionProps) {
  const headingId = useId()

  return (
    <div
      role="group"
      aria-labelledby={collapsed ? undefined : headingId}
      aria-label={collapsed ? sectionTitle : undefined}
      className={cn('flex flex-col gap-1', collapsed ? undefined : 'mt-3', className)}
    >
      {!collapsed ? (
        <p
          id={headingId}
          className="mb-0.5 px-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary"
        >
          {sectionTitle}
        </p>
      ) : null}
      {children}
    </div>
  )
}
