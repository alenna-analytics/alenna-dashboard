/** Shared chrome row: sidebar workspace header + main AppHeader (border included in height). */
export const shellChromeHeaderRowClassName =
  'box-border flex shrink-0 items-center overflow-hidden border-b border-[var(--shell-structure-border)] h-[var(--shell-chrome-header-height)] max-h-[var(--shell-chrome-header-height)] min-h-[var(--shell-chrome-header-height)]'

/** Sidebar nav icon: 16px. */
export const sidebarNavIconClassName = 'size-4 shrink-0'

/** Label line-height matches icon box for vertical centering. */
export const sidebarNavLabelClassName =
  'min-w-0 flex-1 truncate text-sm font-medium leading-4'

/** Shared sidebar nav row: 32px tall (`h-8`), 8px horizontal inset (`px-2`). */
export const sidebarNavItemClassName =
  'flex h-8 min-h-8 shrink-0 items-center rounded-md px-2'

/** Collapsed sidebar: square 32×32 hit target centered in the rail. */
export const sidebarNavItemCollapsedClassName =
  'mx-auto size-8 w-8 shrink-0 justify-center px-0'

export const sidebarShellPaddingClassName = 'px-2 pb-2 pt-0'

export const sidebarInsetPaddingClassName = 'p-2'
