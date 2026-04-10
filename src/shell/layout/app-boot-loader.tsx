import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'

const STAGE_KEYS = ['bootStage1', 'bootStage2', 'bootStage3'] as const

function BootSpinner() {
  return (
    <div className="relative size-[52px]" aria-hidden>
      <div className="absolute inset-0 rounded-full border-[3px] border-white/[0.07]" />
      <div
        className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-accent border-r-accent/45 shadow-[0_0_26px_rgba(91,140,255,0.42)] [animation:boot-spin_0.88s_cubic-bezier(0.45,0.05,0.2,1)_infinite] motion-reduce:[animation:none]"
      />
    </div>
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

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-25%,rgba(91,140,255,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_100%,rgba(0,0,0,0.45),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(21,26,33,0.35)_0%,transparent_40%,transparent_60%,rgba(10,13,18,0.45)_100%)]"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
        <div className="pointer-events-auto flex w-full max-w-sm flex-col items-center gap-4 motion-safe:animate-[boot-card-enter_0.45s_ease-out_0.08s_both]">
          <p className="bg-gradient-to-br from-text-primary to-text-secondary/90 bg-clip-text text-lg font-semibold tracking-tight text-transparent">
            {shellT(lang, 'bootBrandName')}
          </p>
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
