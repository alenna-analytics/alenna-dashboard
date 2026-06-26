import { useLocation } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import { isConfigurationRoute } from '@/pages/configuration/configuration-inner-nav'
import { WORKSPACE_SHELL_COLUMN_CLASS } from '@/shell/layout/workspace-shell-column'
import { shellChromeHeaderRowClassName } from '@/shell/layout/sidebar-layout'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/ui/skeleton'

function ShellHeaderSkeleton() {
  return (
    <div className={cn(shellChromeHeaderRowClassName, 'w-full px-4 lg:px-5')}>
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Skeleton className="size-6 shrink-0 rounded-md lg:hidden" />
          <Skeleton className="size-6 shrink-0 rounded-md" />
          <Skeleton className="h-5 w-36 max-w-[40vw] rounded-md" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="hidden h-8 w-14 rounded-md sm:block" />
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function ShellSidebarSkeleton() {
  return (
    <aside
      className="hidden h-full w-[var(--shell-sidebar-width)] shrink-0 flex-col border-r border-[var(--shell-divider)] bg-white px-2 pb-2 pt-2 lg:flex"
      aria-hidden
    >
      <div className="flex flex-col gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
      <div className="mt-auto pt-2">
        <Skeleton className="size-8 rounded-md" />
      </div>
    </aside>
  )
}

function ShellConfigurationInnerSidebarSkeleton() {
  return (
    <aside
      className="hidden h-full w-full max-w-[var(--shell-inner-sidebar-width)] shrink-0 flex-col overflow-y-auto border-r border-[var(--shell-divider)] bg-white lg:flex"
      aria-hidden
    >
      <div className="flex h-[var(--shell-inner-header-height)] shrink-0 items-center border-b border-[var(--shell-divider)] bg-white px-4">
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>
      <div className="flex flex-col gap-0.5 p-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
    </aside>
  )
}

function SettingsRowSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-4 w-full max-w-md rounded-md" />
      </div>
      <Skeleton className="h-9 w-full rounded-md sm:w-56 sm:shrink-0" />
    </div>
  )
}

function ShellMainSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="w-full space-y-2">
        <Skeleton className="h-8 w-40 max-w-[50%] rounded-md" />
        <Skeleton className="h-4 w-72 max-w-[80%] rounded-md" />
      </div>
      <div className="w-full overflow-hidden rounded-md border border-border-default bg-white divide-y divide-border-default">
        <SettingsRowSkeleton />
        <SettingsRowSkeleton />
      </div>
    </div>
  )
}

export function AppShellBootSkeleton() {
  const { lang } = useLanguage()
  const { pathname } = useLocation()
  const showConfigurationInnerSidebar = isConfigurationRoute(pathname)

  return (
    <div
      className="flex h-svh flex-col overflow-hidden bg-white"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{shellT(lang, 'bootLoadingWorkspace')}</span>
      <Skeleton className="h-1 w-full shrink-0 rounded-none" aria-hidden />
      <ShellHeaderSkeleton />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <ShellSidebarSkeleton />
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          {showConfigurationInnerSidebar ? <ShellConfigurationInnerSidebarSkeleton /> : null}
          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
            <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
              <div className={cn(WORKSPACE_SHELL_COLUMN_CLASS, 'min-h-full py-3 lg:py-4')}>
                <ShellMainSkeleton />
              </div>
            </main>
          </section>
        </div>
      </div>
    </div>
  )
}
