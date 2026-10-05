import { AlertTriangle } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import { ContextAlertCard } from '@/ui/context-alert'

type AmazonFeesNoticeProps = {
  lang: string
}

export function AmazonFeesUnavailableNotice({ lang }: AmazonFeesNoticeProps) {
  return (
    <ContextAlertCard
      icon={AlertTriangle}
      tone="warning"
      title={shellT(lang, 'integrationAmazonFeesUnavailableBanner')}
    />
  )
}
