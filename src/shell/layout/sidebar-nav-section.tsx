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
      className={cn('flex flex-col', collapsed ? 'gap-1' : 'mt-3 gap-1', className)}
    >
      {!collapsed ? (
        <p
          id={headingId}
          className="mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary"
        >
          {sectionTitle}
        </p>
      ) : null}
      {children}
    </div>
  )
}
