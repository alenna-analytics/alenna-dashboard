import { AlertTriangle } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'

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
  const descriptionKey =
    memberCount > 1
      ? 'settingsDeleteAccountCardDescriptionWithMembers'
      : 'settingsDeleteAccountCardDescription'

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.01em] text-text-primary">
          {shellT(lang, 'settingsDangerZoneTitle')}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {shellT(lang, 'settingsDangerZoneSubtitle')}
        </p>
      </div>

      <div className="rounded-lg border border-border-default bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--status-red-500)] text-white"
            aria-hidden
          >
            <AlertTriangle className="size-5" strokeWidth={2.25} />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-primary">
                {shellT(lang, 'settingsDeleteAccountCardTitle')}
              </p>
              <p className="text-sm leading-relaxed text-text-secondary">
                {shellT(lang, descriptionKey, { count: memberCount })}
              </p>
            </div>

            <Button type="button" variant="destructive" size="sm" onClick={onRequestDelete}>
              {shellT(lang, 'settingsDeleteAccountRequestButton')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
