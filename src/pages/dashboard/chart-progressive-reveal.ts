import { createElement, useEffect, useState, type ReactElement } from 'react'

import type { DotItemDotProps } from 'recharts'

import { CHART_LINE_MAIN_MS } from '@/pages/dashboard/use-chart-line-load-animation'

export { CHART_LINE_MAIN_MS } from '@/pages/dashboard/use-chart-line-load-animation'

export const CHART_LINE_MINI_MS = 900
export const CHART_PIE_REVEAL_MS = 1200

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

function initialRevealCount(pointCount: number, motionReduced: boolean): number {
  if (pointCount === 0) return 0
  return motionReduced ? pointCount : 1
}

/**
 * Scalar 0→1 progress when `resetKey` changes (pie slice growth, etc.).
 */
export function useRevealProgress(resetKey: string, durationMs: number): number {
  const motionReduced = prefersReducedMotion()
  const [progress, setProgress] = useState(() => (motionReduced ? 1 : 0))

  useEffect(() => {
    if (motionReduced) return

    let cancelled = false
    let raf = 0
    const bootRaf = requestAnimationFrame(() => {
      if (cancelled) return
      setProgress(0)
      const start = performance.now()
      const step = (now: number) => {
        if (cancelled) return
        const t = easeOutCubic(Math.min(1, (now - start) / durationMs))
        setProgress(t)
        if (now - start < durationMs) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(bootRaf)
      cancelAnimationFrame(raf)
    }
  }, [resetKey, durationMs, motionReduced])

  return motionReduced ? 1 : progress
}

/**
 * Reveals series left-to-right: first point only (a dot), then the line grows bucket by bucket.
 */
export function useProgressivePointReveal<T>(
  points: readonly T[],
  resetKey: string,
  durationMs: number = CHART_LINE_MAIN_MS,
): { revealed: readonly T[]; leadingIndex: number } {
  const motionReduced = prefersReducedMotion()
  const pointCount = points.length
  const [count, setCount] = useState(() => initialRevealCount(pointCount, motionReduced))

  useEffect(() => {
    if (motionReduced) return

    const n = points.length
    let cancelled = false
    let raf = 0
    const bootRaf = requestAnimationFrame(() => {
      if (cancelled) return
      if (n === 0) {
        setCount(0)
        return
      }
      setCount(1)
      const start = performance.now()
      const step = (now: number) => {
        if (cancelled) return
        const t = easeOutCubic(Math.min(1, (now - start) / durationMs))
        const next = Math.min(n, Math.max(1, Math.ceil(t * n)))
        setCount(next)
        if (now - start < durationMs) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(bootRaf)
      cancelAnimationFrame(raf)
    }
  }, [resetKey, durationMs, points.length, motionReduced])

  if (motionReduced) {
    return {
      revealed: points,
      leadingIndex: Math.max(0, pointCount - 1),
    }
  }

  const safeCount = Math.min(count, pointCount)
  return {
    revealed: points.slice(0, safeCount),
    leadingIndex: Math.max(0, safeCount - 1),
  }
}

/** Dot renderer for the leading point while the line is still drawing (Recharts 3). */
export function createLeadingEdgeDot(
  leadingIndex: number,
  fill: string,
  radius = 4,
): (props: DotItemDotProps) => ReactElement | null {
  return function LeadingEdgeDot(props) {
    if (props.index !== leadingIndex) return null
    const cx = props.cx
    const cy = props.cy
    if (cx == null || cy == null) return null
    return createElement('circle', { cx, cy, r: radius, fill })
  }
}
