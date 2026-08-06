import { Check, Minus } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

type CheckboxSize = 'sm' | 'md'
type CheckboxVariant = 'brand' | 'accent'

type CheckboxProps = Omit<React.ComponentProps<'input'>, 'type' | 'onChange' | 'size'> & {
  onCheckedChange?: (checked: boolean) => void
  /** Native mixed state for “some rows selected”. */
  indeterminate?: boolean
  size?: CheckboxSize
  variant?: CheckboxVariant
}

const boxClassBySize: Record<CheckboxSize, string> = {
  sm: 'size-3.5 rounded-[3px]',
  md: 'size-4 rounded-[4px]',
}

const iconClassBySize: Record<CheckboxSize, string> = {
  sm: 'size-2.5',
  md: 'size-3',
}

function checkedStyles(variant: CheckboxVariant, visuallyOn: boolean): string {
  if (!visuallyOn) {
    return 'border-border-default bg-bg-elevated'
  }
  if (variant === 'accent') {
    return 'border-[var(--zara-base)] bg-[var(--zara-base)]'
  }
  return 'border-primary bg-primary'
}

function iconClassName(variant: CheckboxVariant, size: CheckboxSize): string {
  return cn(
    'pointer-events-none absolute inset-0 m-auto',
    iconClassBySize[size],
    variant === 'accent' ? 'text-[var(--firefly-base)]' : 'text-white',
  )
}

function Checkbox({
  className,
  checked,
  indeterminate = false,
  onCheckedChange,
  size = 'sm',
  variant = 'brand',
  ...props
}: CheckboxProps) {
  const ref = React.useRef<HTMLInputElement>(null)

  React.useLayoutEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  const visuallyOn = !!checked || indeterminate
  const checkOnly = !!checked && !indeterminate

  return (
    <span className={cn('relative inline-flex shrink-0', boxClassBySize[size], className)}>
      <input
        ref={ref}
        type="checkbox"
        role="checkbox"
        data-slot="checkbox"
        className={cn(
          'peer size-full cursor-pointer appearance-none border transition-[border-color,background-color]',
          boxClassBySize[size],
          checkedStyles(variant, visuallyOn),
          'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      {checkOnly ? (
        <Check
          className={iconClassName(variant, size)}
          strokeWidth={2.25}
          aria-hidden
        />
      ) : null}
      {indeterminate ? (
        <Minus
          className={iconClassName(variant, size)}
          strokeWidth={2.25}
          aria-hidden
        />
      ) : null}
    </span>
  )
}

export { Checkbox }
