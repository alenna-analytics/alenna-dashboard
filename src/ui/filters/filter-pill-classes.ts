import { cn } from '@/lib/utils'

/** Empty / default: dashed pill, compact height (inactive state). */
export function filterPillInactiveClassName(className?: string): string {
  return cn(
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-dashed border-border-default/80',
    'bg-bg-section/50 px-2.5 text-sm font-medium leading-none text-text-primary shadow-none transition-colors',
    'hover:border-border-strong hover:bg-muted/50',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
    'data-[state=open]:border-border-strong data-[state=open]:bg-muted/45',
    className,
  )
}

/** Outer wrap when a value is selected: solid white pill, img 1. */
export function filterPillActiveShellClassName(className?: string): string {
  return cn(
    'inline-flex h-8 max-w-full shrink-0 items-stretch overflow-hidden rounded-md border border-border-default',
    'bg-white text-sm leading-none shadow-none',
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
    'inline-flex min-w-0 flex-1 items-center gap-1.5 px-2 py-0 text-sm font-medium leading-none',
    'text-left transition-colors hover:bg-muted/50',
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
