import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Skeleton } from '@/ui/skeleton'

import { SettlementCompletenessBadge } from './settlement-completeness-badge'
import { SettlementExpandableWaterfall } from './settlement-expandable-waterfall'

type ProductDetailSettlementSectionProps = {
  detail: ProductDetailApi
  t: (key: ShellStringKey) => string
  fmtBase: (value: number) => string
  showValues: boolean
  isFetching: boolean
  periodLabel: string | null
}

export function ProductDetailSettlementSection({
  detail,
  t,
  fmtBase,
  showValues,
  isFetching,
  periodLabel,
}: ProductDetailSettlementSectionProps) {
  const settlement = detail.period_settlement
  const byPlatform = detail.period_settlement_by_platform ?? []

  return (
    <Card className="rounded-none border-none p-0 shadow-none hover:shadow-none">
      <CardHeader className="flex flex-col gap-2 p-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">{t('productsDetailSettlementTitle')}</CardTitle>
            <SettlementCompletenessBadge completeness={settlement.completeness} t={t} />
          </div>
          <CardDescription className="text-xs">{t('productsDetailSettlementDescription')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        {isFetching && showValues ? (
          <Skeleton className="h-64 w-full rounded-md" aria-hidden />
        ) : (
          <SettlementExpandableWaterfall
            settlement={settlement}
            byPlatform={byPlatform}
            fmtBase={fmtBase}
            t={t}
            periodLabel={periodLabel}
          />
        )}
      </CardContent>
    </Card>
  )
}
