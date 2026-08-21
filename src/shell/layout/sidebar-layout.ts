/** Shared chrome row: sidebar workspace header + main AppHeader (border included in height). */
export const shellChromeHeaderRowClassName =
  'box-border flex shrink-0 items-center overflow-visible border-b border-[var(--shell-divider)] bg-white h-[var(--shell-chrome-header-height)] max-h-[var(--shell-chrome-header-height)] min-h-[var(--shell-chrome-header-height)]'

/** Sidebar nav icon: 16px. */
export const sidebarNavIconClassName = 'size-4 shrink-0'

/** Label line-height matches icon box for vertical centering. */
export const sidebarNavLabelClassName =
  'min-w-0 flex-1 truncate text-sm font-semibold leading-4'

/** Shared sidebar nav row: 32px tall (`h-8`), 8px horizontal inset (`px-2`). */
export const sidebarNavItemClassName =
  'flex h-8 min-h-8 shrink-0 items-center rounded-md px-2 text-sm'

/** Collapsed sidebar: square 32×32 hit target centered in the rail. */
export const sidebarNavItemCollapsedClassName =
  'mx-auto size-8 w-8 shrink-0 justify-center px-0'

export const sidebarShellPaddingClassName = 'px-2 pb-2 pt-0'

export const sidebarShellPaddingCollapsedClassName = 'px-0 pb-2 pt-2'

export const sidebarInsetPaddingClassName = 'p-2'

export const internalSidebarAsideClassName =
  'hidden h-full w-[var(--shell-inner-sidebar-width)] min-w-[var(--shell-inner-sidebar-width)] shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-[var(--shell-divider)] bg-white lg:flex'

/** Inner sidebar title: 16px. */
export const internalSidebarHeaderTitleClassName =
  'truncate text-[16px] font-semibold leading-none text-text-primary'

/** Inner sidebar nav row: 24px tall, 14px label. */
export const internalSidebarNavItemClassName =
  'flex h-6 min-h-6 w-full min-w-0 items-center rounded-md px-2 text-sm'

export const internalSidebarNavLabelClassName = 'text-sm font-semibold leading-none'
