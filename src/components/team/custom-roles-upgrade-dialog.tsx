import { PlanUpgradeCta } from '@/components/billing/plan-upgrade-cta'
import type { MeResponse } from '@/lib/types/me-types'
import type { Language } from '@/shell/providers/language-provider'
import { Badge } from '@/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'

type CustomRolesUpgradeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  me: MeResponse
  lang: Language
  title: string
  description: string
  badge: string
}

export function CustomRolesUpgradeDialog({
  open,
  onOpenChange,
  me,
  lang,
  title,
  description,
  badge,
}: CustomRolesUpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center gap-3 px-2 py-6 text-center">
          <Badge variant="success">{badge}</Badge>
          <DialogHeader className="items-center">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <DialogDescription className="max-w-sm text-sm text-text-secondary">
              {description}
            </DialogDescription>
          </DialogHeader>
          <PlanUpgradeCta me={me} lang={lang} variant="primary" size="default" target="growth" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
