/* eslint-disable react-refresh/only-export-components -- shared tooltip tokens + frame */
import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

/** Soft white chart hover tooltip (matches shell `--bg-base`). */
export const CHART_TOOLTIP_BG = '#fefefe'

export const chartTooltipFrameClassName =
  'rounded-xl border-0 bg-[var(--bg-base)] px-3 py-2.5 text-xs font-normal text-text-primary shadow-[0_8px_24px_rgba(15,23,42,0.12)]'

export const chartTooltipContentStyle: CSSProperties = {
  background: CHART_TOOLTIP_BG,
  border: 'none',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
  color: 'var(--text-primary)',
  fontSize: 12,
}

export const chartTooltipItemStyle: CSSProperties = { color: 'var(--text-primary)' }
export const chartTooltipLabelStyle: CSSProperties = { color: 'var(--text-primary)' }

/**
 * Hide the in-chart Recharts wrapper so tooltips never expand overflow/scrollbars.
 * Content is portaled by `ChartTooltipFrame`.
 */
export const chartRechartsTooltipProps = {
  allowEscapeViewBox: { x: true, y: true } as const,
  offset: 12,
  wrapperStyle: {
    outline: 'none',
    visibility: 'hidden',
    pointerEvents: 'none',
    zIndex: 40,
  } as const,
  contentStyle: {
    margin: 0,
    padding: 0,
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    boxShadow: 'none',
  } as const,
}

const VIEWPORT_PAD = 8

function clampTooltipPosition(
  cursorX: number,
  cursorY: number,
  tipW: number,
  tipH: number,
): { left: number; top: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = cursorX
  let top = cursorY - tipH - VIEWPORT_PAD

  // Prefer above the cursor; flip below when needed.
  if (top < VIEWPORT_PAD) {
    top = cursorY + VIEWPORT_PAD
  }

  left = Math.min(Math.max(left, VIEWPORT_PAD + tipW / 2), vw - VIEWPORT_PAD - tipW / 2)
  top = Math.min(Math.max(top, VIEWPORT_PAD), vh - tipH - VIEWPORT_PAD)

  return { left, top }
}

/** Visual surface only (no portal). Use when the caller already portals. */
export function ChartTooltipSurface({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn(chartTooltipFrameClassName, className)}>{children}</div>
}

/**
 * Chart hover card. By default portals to `document.body` and clamps to the
 * viewport so Recharts tooltips never cause page/chart scrollbars or clip.
 *
 * Position follows the pointer (and Recharts wrapper as fallback). Updates go
 * straight to the DOM — Recharts moves its wrapper without React re-renders.
 */
export function ChartTooltipFrame({
  className,
  children,
  portal = true,
}: {
  className?: string
  children: ReactNode
  /** Set false when already rendered inside a fixed portal (e.g. KPI sparkline). */
  portal?: boolean
}) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  useLayoutEffect(() => {
    if (!portal) return

    const tipEl = tipRef.current
    if (!tipEl) return

    const applyPoint = (x: number, y: number) => {
      lastPointRef.current = { x, y }
      const tip = tipEl.getBoundingClientRect()
      const tipW = tip.width || 220
      const tipH = tip.height || 120
      const next = clampTooltipPosition(x, y, tipW, tipH)
      tipEl.style.left = `${next.left}px`
      tipEl.style.top = `${next.top}px`
      tipEl.style.transform = 'translateX(-50%)'
      tipEl.style.visibility = 'visible'
    }

    const syncFromWrapper = () => {
      const anchorEl = anchorRef.current
      if (!anchorEl) return false
      const wrapper = anchorEl.closest('.recharts-tooltip-wrapper') as HTMLElement | null
      if (!wrapper) return false
      const rect = wrapper.getBoundingClientRect()
      applyPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      return true
    }

    // Prefer live pointer — stays next to the active chart point.
    const onMouseMove = (event: MouseEvent) => {
      applyPoint(event.clientX, event.clientY)
    }

    let raf = 0
    const tick = () => {
      // Keep wrapper sync for keyboard/programmatic hovers; mouse wins when present.
      if (!lastPointRef.current) syncFromWrapper()
      raf = window.requestAnimationFrame(tick)
    }

    syncFromWrapper()
    raf = window.requestAnimationFrame(tick)
    window.addEventListener('mousemove', onMouseMove, true)
    window.addEventListener('resize', syncFromWrapper)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove, true)
      window.removeEventListener('resize', syncFromWrapper)
    }
  }, [portal])

  if (!portal) {
    return <ChartTooltipSurface className={className}>{children}</ChartTooltipSurface>
  }

  return (
    <>
      <div ref={anchorRef} className="pointer-events-none size-0" aria-hidden />
      {createPortal(
        <div
          ref={tipRef}
          className="pointer-events-none fixed z-80"
          style={{ visibility: 'hidden', left: 0, top: 0 }}
        >
          <ChartTooltipSurface className={className}>{children}</ChartTooltipSurface>
        </div>,
        document.body,
      )}
    </>
  )
}

export function ChartTooltipTitle({ children }: { children: ReactNode }) {
  return <p className="mb-1.5 text-[13px] font-semibold text-text-primary">{children}</p>
}

/** Series row: color dot + label + gray value badge (img 3). */
export function ChartTooltipSeriesRow({
  color,
  label,
  value,
}: {
  color?: string
  label: ReactNode
  value: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 py-0.5">
      <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
        {color ? (
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: color }}
            aria-hidden
          />
        ) : null}
        <span className="min-w-0 truncate">{label}</span>
      </div>
      <span className="inline-flex w-fit max-w-full rounded-md bg-muted px-1.5 py-0.5 text-[12px] font-medium tabular-nums text-text-primary">
        {value}
      </span>
    </div>
  )
}

/** Title-hover calc tooltip (chart section headers). Chart series hover uses ChartTooltipFrame — leave that alone. */
export function MetricCalcTooltipBody({
  title,
  description,
  formulaLeft,
  formulaParts,
  formulaJoiner = ' + ',
}: {
  title: string
  description?: string
  formulaLeft?: string
  formulaParts?: readonly string[]
  /** Between green terms; default + for calc formulas. */
  formulaJoiner?: string
}) {
  const hasFormula = Boolean(formulaParts && formulaParts.length > 0)
  return (
    <div className="max-w-[22rem] space-y-1.5 text-left">
      <p className="text-[13px] font-semibold text-text-primary">{title}</p>
      {description ? (
        <p className="text-[12px] font-normal leading-snug text-text-secondary">{description}</p>
      ) : null}
      {hasFormula ? (
        <p className="font-mono text-[10px] font-normal leading-relaxed">
          {formulaLeft ? <span className="text-text-primary">{formulaLeft}</span> : null}
          {formulaParts!.map((part, index) => (
            <span key={`${part}-${index}`}>
              {index > 0 ? <span className="text-text-tertiary">{formulaJoiner}</span> : null}
              <span className="text-emerald-700">{part}</span>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  )
}
