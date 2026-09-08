import type { ComponentProps, ReactElement } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '@/lib/utils'

function TooltipProvider({
  delayDuration = 0,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
  )
}

function Tooltip({
  ...props
}: ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props} />
}

function TooltipTrigger({
  ...props
}: ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger {...props} />
}

/** Soft white surface — matches calc/title tooltips (img 1); do not use for chart series hover. */
const tooltipContentClassName =
  'z-80 max-w-xs overflow-hidden rounded-md border border-border-subtle bg-[var(--bg-base)] px-3 py-2 text-xs font-semibold text-text-primary shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition-all duration-150'

function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(tooltipContentClassName, className)}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}

function DisabledTooltip({
  reason,
  children,
}: {
  reason: string | null
  children: ReactElement
}) {
  if (!reason) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{reason}</TooltipContent>
    </Tooltip>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, DisabledTooltip }
