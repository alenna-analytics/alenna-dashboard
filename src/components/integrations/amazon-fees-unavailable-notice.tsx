import { shellT } from '@/lib/i18n/shell-strings'

type AmazonFeesUnavailableNoticeProps = {
  lang: string
}

export function AmazonFeesUnavailableNotice({ lang }: AmazonFeesUnavailableNoticeProps) {
  return (
    <p
      className="rounded-md border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
      role="status"
    >
      {shellT(lang, 'integrationAmazonFeesUnavailableBanner')}
    </p>
  )
}
