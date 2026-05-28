import { useEffect, useState } from 'react'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function chartMotionEnabled(): boolean {
  return !prefersReducedMotion()
}

export const CHART_LINE_MAIN_MS = 600
export const CHART_LINE_MINI_MS = 400
export const CHART_BAR_MS = 450
export const CHART_PIE_REVEAL_MS = 500

export type RechartsEnterAnimationProps = {
  isAnimationActive: boolean
  animationDuration: number
  animationEasing: 'ease-out'
  animationBegin: number
}

/** Recharts only draws enter animation when the series mounts with this enabled (toggling later does nothing). */
export function rechartsEnterAnimationProps(durationMs: number): RechartsEnterAnimationProps {
  return {
    isAnimationActive: chartMotionEnabled(),
    animationDuration: durationMs,
    animationEasing: 'ease-out',
    animationBegin: 0,
  }
}

/**
 * Staggered scaleX reveal for horizontal bar rows (compositor-friendly).
 */
export function useBarWidthLoadAnimation(resetKey: string): boolean {
  const motionReduced = prefersReducedMotion()
  const [showFull, setShowFull] = useState(motionReduced)

  useEffect(() => {
    if (motionReduced) return

    let cancelled = false
    let rafId = 0
    const startTimer = window.setTimeout(() => {
      if (cancelled) return
      setShowFull(false)
      rafId = window.requestAnimationFrame(() => {
        if (!cancelled) setShowFull(true)
      })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(startTimer)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [resetKey, motionReduced])

  return motionReduced || showFull
}
