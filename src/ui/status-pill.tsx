/* eslint-disable react-refresh/only-export-components -- StatusPill + statusPillVariants */
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const statusPillVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center rounded-full px-2.5 py-1 text-[length:var(--text-micro)] font-medium leading-none whitespace-nowrap',
  {
    variants: {
      variant: {
        success:
          'bg-[var(--pill-success-bg)] text-[var(--pill-success-text)]',
        error:
          'bg-[var(--pill-error-bg)] text-[var(--pill-error-text)]',
        warning:
          'bg-[var(--pill-warning-bg)] text-[var(--pill-warning-text)]',
        info: 'bg-[var(--info-dim)] text-[var(--info)]',
        neutral:
          'bg-[var(--platinum-blonde-300)] text-text-secondary',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

function StatusPill({
  className,
  variant = 'neutral',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof statusPillVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<"span">(
      {
        className: cn(statusPillVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: 'status-pill',
      variant,
    },
  })
}

export { StatusPill, statusPillVariants }
