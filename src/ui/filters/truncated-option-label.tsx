import * as React from 'react'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

export function TruncatedOptionLabel({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [overflows, setOverflows] = React.useState(false)

  const check = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    setOverflows(el.scrollWidth > el.clientWidth + 1)
  }, [])

  React.useLayoutEffect(() => {
    check()
  }, [label, check])

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => check())
    ro.observe(el)
    return () => ro.disconnect()
  }, [check])

  const textSpan = (
    <span
      ref={ref}
      className={cn('min-w-0 flex-1 truncate', className)}
      onMouseEnter={check}
    >
      {label}
    </span>
  )

  if (!overflows) {
    return textSpan
  }

  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>{textSpan}</TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-[min(20rem,calc(100vw-2rem))]"
      >
        <span className="wrap-break-word">{label}</span>
      </TooltipContent>
    </Tooltip>
  )
}
