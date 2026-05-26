import { cn } from '@/lib/utils'

import { AppSidebarPanel } from '@/shell/layout/app-sidebar-panel'

type AppSidebarProps = {
  collapsed: boolean
  onToggle: () => void
  companyName: string
  companySubtitle: string
  className?: string
}

export function AppSidebar({
  collapsed,
  onToggle,
  companyName,
  companySubtitle,
  className,
}: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col transition-[width] duration-200 ease-out',
        collapsed ? 'w-[3.75rem]' : 'w-[240px] min-w-[240px]',
        className,
      )}
    >
      <AppSidebarPanel
        collapsed={collapsed}
        onToggle={onToggle}
        companyName={companyName}
        companySubtitle={companySubtitle}
        className="h-full"
      />
    </aside>
  )
}
