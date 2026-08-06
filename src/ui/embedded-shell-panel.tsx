import { useEffect, useState, type ReactNode } from 'react'
import { XIcon } from 'lucide-react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Sheet, SheetContent } from '@/ui/sheet'

export const embeddedShellPanelWidthClass = 'w-[var(--shell-alerts-panel-width)]'

const embeddedPanelTransitionMs = 220

const embeddedPanelShellClassName =
  'shrink-0 overflow-hidden bg-white motion-safe:transition-[width,border-color] motion-safe:duration-[220ms] motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]'

type EmbeddedShellPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  className?: string
  closeAriaLabel?: string
  hideCloseButton?: boolean
}

function EmbeddedShellPanelFrame({
  children,
  onClose,
  closeAriaLabel = 'Close',
  className,
  hideCloseButton = false,
}: {
  children: ReactNode
  onClose: () => void
  closeAriaLabel?: string
  className?: string
  hideCloseButton?: boolean
}) {
  return (
    <div className={cn('relative flex h-full min-h-0 flex-col', className)}>
      {hideCloseButton ? null : (
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
      )}
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
  hideCloseButton = false,
}: EmbeddedShellPanelProps) {
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')
  const handleClose = () => onOpenChange(false)
  const [renderDesktopPanel, setRenderDesktopPanel] = useState(open)
  const [panelVisible, setPanelVisible] = useState(open)

  useEffect(() => {
    if (!open) {
      let timer: number | undefined
      const frame = window.requestAnimationFrame(() => {
        setPanelVisible(false)
        timer = window.setTimeout(() => {
          setRenderDesktopPanel(false)
        }, embeddedPanelTransitionMs)
      })
      return () => {
        window.cancelAnimationFrame(frame)
        if (timer !== undefined) window.clearTimeout(timer)
      }
    }

    let frame2: number | undefined
    const frame1 = window.requestAnimationFrame(() => {
      setRenderDesktopPanel(true)
      frame2 = window.requestAnimationFrame(() => {
        setPanelVisible(true)
      })
    })
    return () => {
      window.cancelAnimationFrame(frame1)
      if (frame2 !== undefined) window.cancelAnimationFrame(frame2)
    }
  }, [open])

  return (
    <>
      {isLargeScreen && renderDesktopPanel ? (
        <div
          aria-hidden={!open}
          inert={!open ? true : undefined}
          className={cn(
            embeddedPanelShellClassName,
            panelVisible
              ? 'w-[var(--shell-alerts-panel-width)] border-l border-[var(--shell-divider)]'
              : 'w-0 border-l border-transparent',
          )}
        >
          <aside
            className={cn(
              'flex h-full min-h-0 flex-col overflow-hidden bg-white',
              embeddedShellPanelWidthClass,
              className,
            )}
          >
            <EmbeddedShellPanelFrame
              onClose={handleClose}
              closeAriaLabel={closeAriaLabel}
              hideCloseButton={hideCloseButton}
            >
              {children}
            </EmbeddedShellPanelFrame>
          </aside>
        </div>
      ) : null}
      {!isLargeScreen ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="right"
            className={cn(
              'flex w-full max-w-[var(--shell-alerts-panel-width)] flex-col overflow-hidden bg-white',
              className,
            )}
          >
            <EmbeddedShellPanelFrame
              onClose={handleClose}
              closeAriaLabel={closeAriaLabel}
              hideCloseButton={hideCloseButton}
            >
              {children}
            </EmbeddedShellPanelFrame>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  )
}
