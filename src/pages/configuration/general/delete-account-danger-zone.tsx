import { AlertTriangle } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import { settingsDescriptionClassName, SettingsSectionHeader, dangerActionCardClassName } from '@/pages/configuration/settings-layout'
import { Button } from '@/ui/button'
import { cn } from '@/lib/utils'

type DeleteAccountDangerZoneProps = {
  lang: string
  memberCount: number
  onRequestDelete: () => void
}

export function DeleteAccountDangerZone({
  lang,
  memberCount,
  onRequestDelete,
}: DeleteAccountDangerZoneProps) {
  const otherMemberCount = Math.max(0, memberCount - 1)
  const descriptionKey =
    otherMemberCount > 1
      ? 'settingsDeleteAccountCardDescriptionWithMembers'
      : otherMemberCount === 1
        ? 'settingsDeleteAccountCardDescriptionWithOneMember'
        : 'settingsDeleteAccountCardDescription'

  return (
    <section className="space-y-6">
      <SettingsSectionHeader
        title={shellT(lang, 'settingsDangerZoneTitle')}
        description={shellT(lang, 'settingsDangerZoneSubtitle')}
      />

      <div className={dangerActionCardClassName}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className="flex size-[23px] shrink-0 items-center justify-center rounded-md bg-[var(--status-red-500)] text-white"
            aria-hidden
          >
            <AlertTriangle className="size-3.5" strokeWidth={2.25} />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {shellT(lang, 'settingsDeleteAccountCardTitle')}
              </p>
              <p className={cn('mt-1', settingsDescriptionClassName)}>
                {shellT(lang, descriptionKey, { count: otherMemberCount })}
              </p>
            </div>

            <Button type="button" variant="destructive" size="tiny" onClick={onRequestDelete}>
              {shellT(lang, 'settingsDeleteAccountRequestButton')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
