import type { ComponentProps } from 'react'
import { Info } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

export type InfoTooltipProps = ComponentProps<typeof TooltipContent> & {
  stopClick?: boolean
}

export function InfoTooltip({
  children,
  className,
  side = 'top',
  stopClick,
  ...props
}: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-text-secondary"
          aria-label={typeof children === 'string' ? children : undefined}
          onClick={stopClick ? (event) => event.stopPropagation() : undefined}
        >
          <Info className="size-3" strokeWidth={1.75} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className={cn('max-w-[260px] text-left text-xs font-normal leading-snug', className)}
        {...props}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  )
}
