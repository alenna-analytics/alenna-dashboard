import { useCallback, type MouseEvent } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'

type CopyTextButtonProps = {
  text: string
  copiedLabel: string
  failedLabel: string
  copyAriaLabel: string
  className?: string
  disabled?: boolean
}

export function CopyTextButton({
  text,
  copiedLabel,
  failedLabel,
  copyAriaLabel,
  className,
  disabled = false,
}: CopyTextButtonProps) {
  const onClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      const value = text.trim()
      if (!value || disabled) return
      try {
        await navigator.clipboard.writeText(value)
        toast.message(copiedLabel)
      } catch {
        toast.error(failedLabel)
      }
    },
    [text, disabled, copiedLabel, failedLabel],
  )

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
