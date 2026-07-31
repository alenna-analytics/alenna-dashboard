import { XIcon } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { Button } from '@/ui/button'
import { Sheet, SheetContent } from '@/ui/sheet'

import { AppSidebarPanel } from '@/shell/layout/app-sidebar-panel'

type AppSidebarDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppSidebarDrawer({ open, onOpenChange }: AppSidebarDrawerProps) {
  const { lang } = useLanguage()
  const close = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="inset-y-0 left-0 h-full max-h-none w-full max-w-none rounded-none border-0 border-r border-[var(--shell-divider)] p-0"
      >
        <div className="relative flex h-full min-h-0 flex-col">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-3 right-3 z-10"
            onClick={close}
            aria-label={shellT(lang, 'ariaCloseNavMenu')}
          >
            <XIcon className="size-4" />
          </Button>
          <AppSidebarPanel
            collapsed={false}
            controlMode="expanded"
            onControlModeChange={() => {}}
            hideCollapseToggle
            onNavigate={close}
            className="h-full min-h-0 rounded-none border-0 pr-12 shadow-none"
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
