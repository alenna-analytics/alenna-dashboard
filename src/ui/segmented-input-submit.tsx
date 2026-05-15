import type { ReactNode } from 'react'
import { CircleX, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { filterPillActiveShellClassName } from '@/ui/filters/filter-pill-classes'

export type SegmentedInputSubmitProps = {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  submitLabel: ReactNode
  onSubmit: () => void
  submitDisabled?: boolean
  submitPending?: boolean
  onClose?: () => void
  closeAriaLabel?: string
  className?: string
  inputClassName?: string
  /** Screen reader label for the control group */
  ariaLabel?: string
}

/**
 * Filter-pill style shell: [ input | submit | optional close ].
 * Close mirrors filter clear but sits on the trailing edge (inverted layout).
 */
export function SegmentedInputSubmit({
  value,
  onValueChange,
  placeholder,
  submitLabel,
  onSubmit,
  submitDisabled = false,
  submitPending = false,
  onClose,
  closeAriaLabel = 'Close',
  className,
  inputClassName,
  ariaLabel,
}: SegmentedInputSubmitProps) {
  const canSubmit = !submitDisabled && !submitPending

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        filterPillActiveShellClassName(),
        'max-w-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 rounded-sm',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center px-2.5">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={submitPending}
          className={cn(
            'min-w-0 flex-1 border-0 bg-transparent py-0 text-sm leading-tight text-text-primary outline-none placeholder:text-text-tertiary disabled:opacity-50',
            inputClassName,
          )}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSubmit) {
              e.preventDefault()
              onSubmit()
            }
          }}
        />
      </div>
      {onClose ? (
        <>
          <button
            type="button"
            className={cn(
              'flex shrink-0 items-center justify-center border-0 px-2 text-text-secondary transition-colors',
              'hover:bg-muted/50 hover:text-text-primary',
              'focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
            aria-label={closeAriaLabel}
            onClick={onClose}
          >
            <CircleX className="size-3.5" aria-hidden />
          </button>
        </>
      ) : null}
      <button
        type="button"
        disabled={!canSubmit}
        className={cn(
          'shrink-0 px-3 text-xs font-semibold text-white transition-opacity',
          'bg-text-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40',
          'focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        )}
        onClick={() => {
          if (canSubmit) onSubmit()
        }}
      >
        {submitPending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden /> : submitLabel}
      </button>

    </div>
  )
}
