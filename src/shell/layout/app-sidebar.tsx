import { cn } from '@/lib/utils'

import { AppSidebarPanel } from '@/shell/layout/app-sidebar-panel'

type AppSidebarProps = {
  collapsed: boolean
  onToggle: () => void
  companyName: string
  companyLogoUrl?: string | null
  companySubtitle: string
  className?: string
}

export function AppSidebar({
  collapsed,
  onToggle,
  companyName,
  companyLogoUrl,
  companySubtitle,
  className,
}: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col overflow-hidden motion-reduce:transition-none',
        'transition-[width] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]',
        '[contain:layout]',
        collapsed ? 'w-[47px]' : 'w-60',
        className,
      )}
    >
      <AppSidebarPanel
        collapsed={collapsed}
        onToggle={onToggle}
        companyName={companyName}
        companyLogoUrl={companyLogoUrl}
        companySubtitle={companySubtitle}
        className="h-full"
      />
    </aside>
  )
}
