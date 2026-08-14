import { cn } from '@/lib/utils'

const filterPillTypographyClassName =
  'text-xs font-medium leading-none font-[family-name:var(--font-display)]'

/** Empty / default: dotted pill, compact height (inactive state). */
export function filterPillInactiveClassName(className?: string): string {
  return cn(
    'inline-flex h-7 shrink-0 items-center rounded-md border border-dotted border-[color:var(--filter-pill-border)]',
    'bg-white px-2.5 text-text-primary shadow-none transition-[background-color,border-color]',
    filterPillTypographyClassName,
    'hover:bg-muted/50 hover:border-[color:var(--filter-pill-border-hover)]',
    'data-[state=open]:bg-muted/50 data-[state=open]:border-[color:var(--filter-pill-border-hover)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
    className,
  )
}

/** Outer wrap when a value is selected: solid white pill. */
export function filterPillActiveShellClassName(className?: string): string {
  return cn(
    'inline-flex h-7 max-w-full shrink-0 items-stretch overflow-hidden rounded-md border border-border-default',
    'bg-white leading-none shadow-none',
    filterPillTypographyClassName,
    className,
  )
}

/** Clear (X) segment — sibling of opening trigger, not inside it. */
export function filterPillClearButtonClassName(className?: string): string {
  return cn(
    'flex shrink-0 items-center justify-center border-r border-border-default px-1.5',
    'text-text-secondary transition-colors hover:bg-muted/50 hover:text-text-primary',
    'focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
    className,
  )
}

/** Main segment that opens the popover when active. */
export function filterPillActiveTriggerClassName(className?: string): string {
  return cn(
    'inline-flex min-w-0 flex-1 items-center gap-1.5 px-2 py-0 text-left transition-colors',
    filterPillTypographyClassName,
    'hover:bg-muted/50',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
    className,
  )
}

/** Selected filter value — green accent via `--filter-pill-value-active` → `--color-accent-forest`. */
export function filterPillValueActiveClassName(className?: string): string {
  return cn(
    'min-w-0 flex-1 truncate font-medium text-[color:var(--filter-pill-value-active)]',
    className,
  )
}

/** @deprecated use filterPillInactiveClassName — dashed inactive only */
export function filterPillTriggerClassName(className?: string): string {
  return filterPillInactiveClassName(className)
}
