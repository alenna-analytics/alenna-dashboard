import { cn } from '@/lib/utils'

import { AppSidebarPanel } from '@/shell/layout/app-sidebar-panel'

type AppSidebarProps = {
  collapsed: boolean
  onToggle: () => void
  className?: string
}

export function AppSidebar({ collapsed, onToggle, className }: AppSidebarProps) {
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
        className="h-full"
      />
    </aside>
  )
}
