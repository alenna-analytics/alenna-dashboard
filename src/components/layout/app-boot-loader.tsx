export function AppBootLoader() {
  return (
    <div
      className="flex h-svh flex-col items-center justify-center gap-5 bg-bg-base"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading workspace</span>
      <div
        className="size-11 rounded-full border-2 border-border-subtle border-t-accent shadow-[0_0_28px_color-mix(in_oklab,var(--primary)_28%,transparent)] animate-spin"
        aria-hidden
      />
      <p className="text-[11px] font-medium tracking-widest text-text-tertiary uppercase">
        Loading
      </p>
    </div>
  )
}
