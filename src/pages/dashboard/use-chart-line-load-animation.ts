import { useEffect, useState } from 'react'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Turns on Recharts line / path draw animation once per `resetKey` (e.g. new date range),
 * then off so brush zoom does not replay the animation.
 */
export function useChartLineLoadAnimation(
  resetKey: string,
  durationMs: number,
): boolean {
  const [active, setActive] = useState(false)

  useEffect(() => {
    let cancelled = false
    let endTimer: ReturnType<typeof window.setTimeout> | undefined
    const startTimer = window.setTimeout(() => {
      if (cancelled) return
      if (prefersReducedMotion()) {
        setActive(false)
        return
      }
      setActive(true)
      endTimer = window.setTimeout(() => {
        if (!cancelled) setActive(false)
      }, durationMs + 80)
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(startTimer)
      if (endTimer !== undefined) window.clearTimeout(endTimer)
    }
  }, [resetKey, durationMs])

  return active
}

export const CHART_LINE_MAIN_MS = 1500
export const CHART_LINE_MINI_MS = 900
