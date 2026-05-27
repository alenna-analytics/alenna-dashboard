import type { ReactNode } from 'react'
import { Pencil } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { cn } from '@/lib/utils'

import { ProductCostOverTimeChart } from './product-cost-over-time-chart'
import type { ProductCostPriceChartData } from './product-cost-chart-points'

const NUM = 'font-numeric tabular-nums'

type ProductDetailConfigSectionProps = {
  t: (key: ShellStringKey) => string
  baseCurrency: string
  bigCostFormatted: string
  updatedBadge: string
  effectiveSinceLabel: string
  avgHistory: number | null
  chartData: ProductCostPriceChartData
  costAmountWithBaseCode: (formatted: string, baseCurrency: string, codeClassName: string) => ReactNode
  fmtBase: (value: number) => string
  updatedAtIso: string
  onEditCost: () => void
}

export function ProductDetailConfigSection({
  t,
  baseCurrency,
  bigCostFormatted,
  updatedBadge,
  effectiveSinceLabel,
  avgHistory,
  chartData,
  costAmountWithBaseCode,
  fmtBase,
  updatedAtIso,
  onEditCost,
}: ProductDetailConfigSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">
          {t('productsDetailSectionProductConfigTitle')}
        </h2>
        <Button type="button" variant="outline" size="default" onClick={onEditCost}>
          <Pencil className="size-3.5" />
          {t('productsDetailEditAria')}
        </Button>
      </div>

      <Card className="border-none p-0 shadow-none hover:shadow-none">
        <CardContent className="grid gap-4 p-0 lg:grid-cols-3 lg:items-stretch">
          <div className="flex flex-col gap-3 lg:col-span-1">
            <Card size="sm" className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-text-secondary">
                  {t('productsDetailKpiCurrentCost')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-0">
                <p className={cn('text-2xl font-semibold text-text-primary sm:text-3xl', NUM)}>
                  {costAmountWithBaseCode(bigCostFormatted, baseCurrency, 'text-sm sm:text-base')}
                </p>
                <p className="text-xs text-text-tertiary">
                  {t('productsDetailEffectiveSince')}{' '}
                  <span className={cn('font-medium text-text-secondary', NUM)}>{effectiveSinceLabel}</span>
                </p>
                <Badge variant="info" className={cn('font-normal', NUM)}>
                  {updatedBadge}
                </Badge>
              </CardContent>
            </Card>
            <Card size="sm" className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-text-secondary">
                  {t('productsDetailKpiAvgCost')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className={cn('text-2xl font-semibold text-text-primary sm:text-3xl', NUM)}>
                  {costAmountWithBaseCode(
                    avgHistory != null ? fmtBase(avgHistory) : '—',
                    baseCurrency,
                    'text-sm sm:text-base',
                  )}
                </p>
                <p className="text-xs text-text-tertiary">
                  {t('productsDetailLastSyncedLabel')}{' '}
                  <span className={cn('font-medium text-text-secondary', NUM)}>
                    {new Date(updatedAtIso).toLocaleString()}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="flex min-w-0 flex-col lg:col-span-2">
            <p className="mb-2 text-xs font-medium text-text-secondary">
              {t('productsDetailCostVsPriceOverTimeTitle')}
            </p>
            <div className="min-h-64 flex-1">
              <ProductCostOverTimeChart data={chartData.points} series={chartData.series} t={t} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
