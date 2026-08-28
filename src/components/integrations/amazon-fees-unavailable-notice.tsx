import { AlertTriangle } from 'lucide-react'

import type { AmazonFeesNoticeState } from '@/lib/integrations/amazon-fees-notice'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { ContextAlertCard } from '@/ui/context-alert'

type AmazonFeesNoticeProps = {
  lang: string
  state: Exclude<AmazonFeesNoticeState, 'none'>
}

function bannerKey(state: Exclude<AmazonFeesNoticeState, 'none'>): ShellStringKey {
  return state === 'partial'
    ? 'integrationAmazonFeesPartialBanner'
    : 'integrationAmazonFeesUnavailableBanner'
}

export function AmazonFeesUnavailableNotice({ lang, state }: AmazonFeesNoticeProps) {
  return (
    <ContextAlertCard
      icon={AlertTriangle}
      tone="warning"
      title={shellT(lang, bannerKey(state))}
    />
  )
}
