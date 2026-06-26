import { Sheet, SheetContent } from '@/ui/sheet'

import { AppSidebarPanel } from '@/shell/layout/app-sidebar-panel'

type AppSidebarDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppSidebarDrawer({ open, onOpenChange }: AppSidebarDrawerProps) {
  const close = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[min(100vw-1.5rem,280px)] max-w-[280px] gap-0 p-0"
      >
        <AppSidebarPanel
          collapsed={false}
          hideCollapseToggle
          onNavigate={close}
          className="h-full min-h-0 rounded-none border-0 shadow-none"
        />
      </SheetContent>
    </Sheet>
  )
}
