import { cn } from '@/lib/utils'

import type { SidebarControlMode } from '@/lib/shell/sidebar-control-prefs'

import { AppSidebarPanel } from '@/shell/layout/app-sidebar-panel'

type AppSidebarProps = {
  collapsed: boolean
  controlMode: SidebarControlMode
  onControlModeChange: (mode: SidebarControlMode) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  className?: string
}

export function AppSidebar({
  collapsed,
  controlMode,
  onControlModeChange,
  onMouseEnter,
  onMouseLeave,
  className,
}: AppSidebarProps) {
  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        'flex shrink-0 flex-col overflow-x-hidden border-r border-[var(--shell-divider)] bg-white motion-reduce:transition-none',
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
        controlMode={controlMode}
        onControlModeChange={onControlModeChange}
        className="h-full"
      />
    </aside>
  )
}
