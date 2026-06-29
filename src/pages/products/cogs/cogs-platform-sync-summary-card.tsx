import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { CogsPlatformSyncPreviewResponse } from '@/lib/types/cogs-platform-sync'
import { cn } from '@/lib/utils'

type CogsPlatformSyncSummaryCardProps = {
  lang: string
  summary: CogsPlatformSyncPreviewResponse['summary']
}

type SummaryMetric = {
  labelKey: ShellStringKey
  value: number
  emphasize?: boolean
}

function SummaryMetricItem({
  lang,
  labelKey,
  value,
  emphasize = false,
}: SummaryMetric & { lang: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border-subtle bg-white px-3 py-2.5">
      <p className="text-xs font-medium text-text-secondary">{shellT(lang, labelKey)}</p>
      <p
        className={cn(
          'mt-1 text-xl font-semibold tabular-nums tracking-tight',
          emphasize ? 'text-amber-800' : 'text-text-primary',
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function CogsPlatformSyncSummaryCard({ lang, summary }: CogsPlatformSyncSummaryCardProps) {
  const metrics: SummaryMetric[] = [
    { labelKey: 'productsCogsSyncSummaryMatchedLabel', value: summary.matched },
    {
      labelKey: 'productsCogsSyncSummaryDifferentLabel',
      value: summary.different,
      emphasize: summary.different > 0,
    },
    { labelKey: 'productsCogsSyncSummarySameLabel', value: summary.same },
    {
      labelKey: 'productsCogsSyncSummaryMissingLabel',
      value: summary.missing_platform_cost,
      emphasize: summary.missing_platform_cost > 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((metric) => (
        <SummaryMetricItem key={metric.labelKey} lang={lang} {...metric} />
      ))}
    </div>
  )
}
