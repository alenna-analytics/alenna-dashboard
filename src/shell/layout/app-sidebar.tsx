import { cn } from '@/lib/utils'

import type { MeResponse } from '@/lib/types/me-types'

import { AppSidebarPanel } from '@/shell/layout/app-sidebar-panel'

type AppSidebarProps = {
  collapsed: boolean
  onToggle: () => void
  className?: string
  companyName: string
  me: MeResponse | null
}

export function AppSidebar({ collapsed, onToggle, className, companyName, me }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col overflow-hidden border-r border-[var(--shell-divider)] bg-white motion-reduce:transition-none',
        'transition-[width] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]',
        '[contain:layout]',
        collapsed
          ? 'w-[var(--shell-sidebar-collapsed-width)]'
          : 'w-[var(--shell-sidebar-width)]',
        className,
      )}
    >
      <AppSidebarPanel
        collapsed={collapsed}
        onToggle={onToggle}
        companyName={companyName}
        me={me}
        className="h-full"
      />
    </aside>
  )
}
