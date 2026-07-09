import { toast } from 'sonner'

import { AccountDeletionPendingBanner } from '@/pages/configuration/general/account-deletion-pending-banner'
import { useCancelAccountDeletionMutation } from '@/pages/configuration/general/use-account-deletion-mutations'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'

function formatDeletionDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function AccountDeletionPendingShellBanner() {
  const { lang } = useLanguage()
  const { me, refetchMe } = useWorkspace()
  const cancelMutation = useCancelAccountDeletionMutation()

  if (me?.account_deletion_status !== 'pending') {
    return null
  }

  const isWorkspaceAdmin = me.role === 'admin' || me.role === 'owner'
  const scheduledLabel = formatDeletionDate(me.scheduled_purge_at, lang)

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync()
      await refetchMe()
      toast.success(shellT(lang, 'settingsDeleteAccountToastCancelled'))
    } catch {
      toast.error(shellT(lang, 'settingsDeleteAccountToastFailed'))
    }
  }

  return (
    <AccountDeletionPendingBanner
      lang={lang}
      scheduledDateLabel={scheduledLabel}
      cancelPending={cancelMutation.isPending}
      onCancel={isWorkspaceAdmin ? () => void handleCancel() : undefined}
    />
  )
}
