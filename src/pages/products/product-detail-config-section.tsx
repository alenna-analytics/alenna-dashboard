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
  fmtPlain: (value: number) => string
  updatedAtIso: string
  onEditCost: () => void
  showSectionTitle?: boolean
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
  fmtPlain,
  updatedAtIso,
  onEditCost,
  showSectionTitle = true,
}: ProductDetailConfigSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      {showSectionTitle ? (
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">
          {t('productsDetailSectionProductConfigTitle')}
        </h2>
      ) : null}

      <Card className="border-none p-0 shadow-none hover:shadow-none">
        <CardContent className="flex flex-col gap-4 p-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card size="sm" className="flex-1">
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-text-secondary">
                  {t('productsDetailKpiCurrentCost')}
                </CardTitle>
                <Button type="button" variant="accent" size="sm" onClick={onEditCost}>
                  <Pencil className="size-3.5" />
                  {t('productsDetailEditAria')}
                </Button>
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
                    avgHistory != null ? fmtPlain(avgHistory) : '—',
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
          <div className="flex min-w-0 flex-col">
            <p className="mb-2 text-xs font-medium text-text-secondary">
              {t('productsDetailCostVsPriceOverTimeTitle')}
            </p>
            <div className="min-h-80 w-full sm:min-h-96">
              <ProductCostOverTimeChart data={chartData.points} series={chartData.series} t={t} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
