import { cn } from '@/lib/utils'

/** Card / chart chrome: border only, no shadow. */
export const surfaceCardClassName =
  'rounded-lg border border-border-card bg-bg-card-strong'

/** Clickable card wrapper — use on buttons/links around a card surface. */
export const surfaceCardInteractiveClassName =
  'rounded-lg transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45'

/** Chart / section container shell. */
export const surfaceSectionClassName = cn(surfaceCardClassName, 'p-4 sm:p-5')

/** Compact KPI row cards. */
export const surfaceKpiCompactClassName = cn(surfaceCardClassName, 'p-3')

/** Primary KPI cards. */
export const surfaceKpiClassName = cn(surfaceCardClassName, 'p-3')

/** Header / toolbar icon control with border (sidebar toggle, etc.). */
export const chromeIconButtonClassName =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-white text-text-secondary shadow-none transition-colors hover:border-border-emphasis hover:bg-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45'

/** Header toolbar icon — no border/background container. */
export const chromeBareIconButtonClassName =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45'

/** Header toolbar text control (connections, currency). */
export const chromeTextButtonClassName =
  'inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-border-default bg-white px-2 text-xs font-semibold text-text-secondary shadow-none transition-colors hover:border-border-emphasis hover:bg-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 disabled:cursor-not-allowed disabled:opacity-60'
