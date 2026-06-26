import type { ReactNode } from 'react'
import { XIcon } from 'lucide-react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Sheet, SheetContent } from '@/ui/sheet'

export const embeddedShellPanelWidthClass = 'w-[var(--shell-alerts-panel-width)]'

type EmbeddedShellPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  className?: string
  closeAriaLabel?: string
}

function EmbeddedShellPanelFrame({
  children,
  onClose,
  closeAriaLabel = 'Close',
  className,
}: {
  children: ReactNode
  onClose: () => void
  closeAriaLabel?: string
  className?: string
}) {
  return (
    <div className={cn('relative flex h-full min-h-0 flex-col', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-3 right-3 z-10 sm:top-4 sm:right-4"
        onClick={onClose}
        aria-label={closeAriaLabel}
      >
        <XIcon className="size-4" />
      </Button>
      {children}
    </div>
  )
}

export function EmbeddedShellPanel({
  open,
  onOpenChange,
  children,
  className,
  closeAriaLabel,
}: EmbeddedShellPanelProps) {
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')
  const handleClose = () => onOpenChange(false)

  return (
    <>
      {open && isLargeScreen ? (
        <aside
          className={cn(
            'flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-[var(--shell-divider)] bg-white',
            embeddedShellPanelWidthClass,
            className,
          )}
        >
          <EmbeddedShellPanelFrame onClose={handleClose} closeAriaLabel={closeAriaLabel}>
            {children}
          </EmbeddedShellPanelFrame>
        </aside>
      ) : null}
      {!isLargeScreen ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="right"
            className={cn('flex max-w-xl flex-col overflow-hidden bg-white', className)}
          >
            <EmbeddedShellPanelFrame onClose={handleClose} closeAriaLabel={closeAriaLabel}>
              {children}
            </EmbeddedShellPanelFrame>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  )
}
