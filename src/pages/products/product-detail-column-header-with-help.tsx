import { HelpCircle } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

type ProductDetailColumnHeaderWithHelpProps = {
  title: string
  helpText?: string
}

export function ProductDetailColumnHeaderWithHelp({
  title,
  helpText,
}: ProductDetailColumnHeaderWithHelpProps) {
  if (!helpText) {
    return <span>{title}</span>
  }
  return (
    <span className="inline-flex items-center gap-1">
      <span>{title}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="shrink-0 rounded-full p-0.5 text-text-tertiary hover:text-text-secondary"
            aria-label={helpText}
            onClick={(e) => e.stopPropagation()}
          >
            <HelpCircle className="size-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-left text-xs leading-snug">
          {helpText}
        </TooltipContent>
      </Tooltip>
    </span>
  )
}
