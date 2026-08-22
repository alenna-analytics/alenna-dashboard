import { useState } from 'react'
import { Sparkles } from 'lucide-react'

import { AdjustPlanSheet } from '@/components/billing/adjust-plan-sheet'
import {
  isBillingOwner,
  upgradeLabelForTarget,
  upgradeTargetForPlan,
  type UpgradeTarget,
} from '@/lib/plan/plan-limit-ui'
import type { MeResponse } from '@/lib/types/me-types'
import { Button } from '@/ui/button'
import type { Language } from '@/shell/providers/language-provider'

type PlanUpgradeCtaProps = {
  me: MeResponse
  lang: Language
  variant?: 'outline' | 'primary'
  size?: 'sm' | 'default'
  className?: string
  onClick?: () => void
  target?: UpgradeTarget
}

export function PlanUpgradeCta({
  me,
  lang,
  variant = 'outline',
  size = 'sm',
  className,
  onClick,
  target,
}: PlanUpgradeCtaProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const label = upgradeLabelForTarget(target ?? upgradeTargetForPlan(me.plan), lang)

  if (!isBillingOwner(me) || !label) return null

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => {
          if (onClick) {
            onClick()
            return
          }
          setSheetOpen(true)
        }}
      >
        <Sparkles className="size-3.5 shrink-0" aria-hidden />
        {label}
      </Button>
      {onClick ? null : (
        <AdjustPlanSheet open={sheetOpen} onOpenChange={setSheetOpen} me={me} />
      )}
    </>
  )
}
