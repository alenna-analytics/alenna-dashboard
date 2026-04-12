import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'

const STAGE_KEYS = ['bootStage1', 'bootStage2', 'bootStage3'] as const

const SPINNER_R = 22.5
const SPINNER_C = 2 * Math.PI * SPINNER_R
const SPINNER_ARC = SPINNER_C * 0.28

function BootSpinner() {
  return (
    <svg
      className="size-[52px]"
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="26"
        cy="26"
        r={SPINNER_R}
        stroke="var(--border-subtle)"
        strokeWidth="3"
        fill="none"
      />
      <g
        className="motion-safe:[animation:boot-spin_0.88s_cubic-bezier(0.45,0.05,0.2,1)_infinite] motion-reduce:animate-none"
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
      >
        <circle
          cx="26"
          cy="26"
          r={SPINNER_R}
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${SPINNER_ARC} ${SPINNER_C - SPINNER_ARC}`}
          fill="none"
          transform="rotate(-90 26 26)"
        />
      </g>
    </svg>
  )
}

export function AppBootLoader() {
  const { lang } = useLanguage()
  const [stageIndex, setStageIndex] = useState(0)

  const stages = useMemo(
    () => STAGE_KEYS.map((k) => shellT(lang, k)),
    [lang],
  )

  useEffect(() => {
    const id = window.setInterval(() => {
      setStageIndex((i) => (i + 1) % stages.length)
    }, 1600)
    return () => window.clearInterval(id)
  }, [stages.length])

  const stageText = stages[stageIndex] ?? ''
  const srStatus = `${shellT(lang, 'bootLoadingWorkspace')}. ${stageText}`

  return (
    <div
      className="relative h-svh overflow-hidden bg-bg-base motion-safe:animate-[boot-loader-enter_0.35s_ease-out]"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{srStatus}</span>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
        <div className="pointer-events-auto flex w-full max-w-sm flex-col items-center gap-4 motion-safe:animate-[boot-card-enter_0.45s_ease-out_0.08s_both]">
          <BootSpinner />
          <div className="flex min-h-[2.5rem] flex-col items-center gap-1 text-center">
            <p
              key={stageIndex}
              className="max-w-[16rem] text-sm font-medium text-text-secondary [animation:boot-stage-fade_0.4s_ease-out]"
            >
              {stageText}
            </p>
            <p className="text-[11px] font-medium tracking-wide text-text-tertiary">
              {shellT(lang, 'bootTagline')}
            </p>
          </div>
          <div className="flex gap-1.5" aria-hidden>
            {stages.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1 w-6 rounded-full transition-colors duration-300',
                  i === stageIndex ? 'bg-accent/90' : 'bg-border-subtle/80'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
