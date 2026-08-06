import type { ReactNode } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Skeleton } from '@/ui/skeleton'

import { ProductDetailKpiPlatformBreakdown } from './product-detail-kpi-platform-breakdown'
import { SettlementCompletenessBadge } from './settlement-completeness-badge'
import { SettlementMiniWaterfall } from './settlement-mini-waterfall'

type ProductDetailSettlementSectionProps = {
  detail: ProductDetailApi
  t: (key: ShellStringKey) => string
  fmtBase: (value: number) => string
  showValues: boolean
  isFetching: boolean
  costAmountWithBaseCode: (formatted: string, baseCurrency: string, codeClassName: string) => ReactNode
  baseCurrency: string
}

export function ProductDetailSettlementSection({
  detail,
  t,
  fmtBase,
  showValues,
  isFetching,
  costAmountWithBaseCode,
  baseCurrency,
}: ProductDetailSettlementSectionProps) {
  const settlement = detail.period_settlement
  const byPlatform = detail.period_settlement_by_platform ?? []

  const platformBreakdown =
    byPlatform.length > 0 ? (
      <ProductDetailKpiPlatformBreakdown
        rows={byPlatform}
        t={t}
        formatValue={(row) => fmtBase(row.estimated_payout)}
      />
    ) : undefined

  const heroValue = showValues ? (
    costAmountWithBaseCode(fmtBase(settlement.estimated_payout), baseCurrency, 'text-xs')
  ) : (
    <Skeleton className="h-8 w-32 max-w-full" aria-hidden />
  )

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
        <div className="rounded-md border border-border-subtle bg-bg-section/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            {t('settlementWfEstimatedPayout')}
          </p>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
            {isFetching && showValues ? (
              <Skeleton className="h-8 w-32 max-w-full" aria-hidden />
            ) : (
              heroValue
            )}
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <SettlementMiniWaterfall settlement={settlement} fmtBase={fmtBase} t={t} />
            {platformBreakdown ? (
              <div>
                <p className="mb-2 text-xs font-medium text-text-secondary">
                  {t('productsDetailSettlementByPlatform')}
                </p>
                {platformBreakdown}
              </div>
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-xs text-text-tertiary">{t('productsDetailSettlementCallout')}</p>
      </CardContent>
    </Card>
  )
}
