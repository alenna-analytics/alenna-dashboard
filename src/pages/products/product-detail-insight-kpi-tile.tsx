import type { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

const NUM = 'font-numeric tabular-nums'

type ProductDetailInsightKpiTileProps = {
  label: string
  helpText?: string
  value: ReactNode
  footer?: ReactNode
  showValues: boolean
  isFetching: boolean
  skeleton: ReactNode
}

export function ProductDetailInsightKpiTile({
  label,
  helpText,
  value,
  footer,
  showValues,
  isFetching,
  skeleton,
}: ProductDetailInsightKpiTileProps) {
  return (
    <div className="rounded-md border border-border-subtle bg-muted/20 px-3 py-2.5">
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        {helpText ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="shrink-0 rounded-full p-0.5 text-text-tertiary hover:text-text-secondary"
                aria-label={helpText}
              >
                <HelpCircle className="size-3.5" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] text-left text-xs leading-snug">
              {helpText}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <p
        className={cn(
          'text-lg font-semibold sm:text-xl',
          showValues ? 'text-text-primary' : 'text-text-tertiary',
          NUM,
        )}
      >
        {isFetching ? skeleton : value}
      </p>
      {footer ? <p className="mt-1 text-[0.65rem] leading-tight text-text-tertiary">{footer}</p> : null}
    </div>
  )
}
