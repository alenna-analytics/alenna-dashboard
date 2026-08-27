/* eslint-disable react-refresh/only-export-components -- StatusPill + statusPillVariants */
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const statusPillVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 py-1 text-[length:var(--text-micro)] font-medium leading-none whitespace-nowrap [&>img]:size-3.5 [&>img]:shrink-0 [&>img]:object-contain [&>svg]:size-3.5 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        success:
          'border-[color:var(--pill-success-border)] bg-[var(--pill-success-bg)] text-[var(--pill-success-text)]',
        error:
          'border-[color:var(--pill-error-border)] bg-[var(--pill-error-bg)] text-[var(--pill-error-text)]',
        warning:
          'border-[color:var(--pill-warning-border)] bg-[var(--pill-warning-bg)] text-[var(--pill-warning-text)]',
        info: 'border-[color:var(--pill-info-border)] bg-[var(--info-dim)] text-[var(--info)]',
        neutral:
          'border-border-default bg-[var(--chrome-muted)] text-text-secondary',
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
        'data-slot': 'status-pill',
      } as useRender.ComponentProps<'span'>,
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
