import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { Check, Copy } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'

const COPIED_RESET_MS = 2000

type CopyTextButtonProps = {
  text: string
  copiedLabel: string
  copyAriaLabel: string
  className?: string
  disabled?: boolean
}

export function CopyTextButton({
  text,
  copiedLabel,
  copyAriaLabel,
  className,
  disabled = false,
}: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [])

  const onClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      const value = text.trim()
      if (!value || disabled) return
      try {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
        resetTimerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS)
      } catch {
        // Clipboard access may fail silently in unsupported contexts.
      }
    },
    [text, disabled],
  )

  if (copied) {
    return (
      <Button
        type="button"
        variant="outline"
        size="xs"
        className={cn('h-7 shrink-0 gap-1 px-2 text-xs text-text-secondary', className)}
        aria-label={copiedLabel}
        tabIndex={-1}
      >
        <Check className="size-3.5" aria-hidden />
        {copiedLabel}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn('size-7 shrink-0 text-text-tertiary hover:text-text-primary', className)}
      aria-label={copyAriaLabel}
      disabled={disabled || !text.trim()}
      onClick={onClick}
    >
      <Copy className="size-3.5" aria-hidden />
    </Button>
  )
}
