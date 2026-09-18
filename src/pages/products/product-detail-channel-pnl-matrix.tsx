import { useMemo } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { ChannelsPnlTable } from '@/pages/channels/channels-pnl-table'
import { useTaxRatesQuery } from '@/pages/configuration/tax-rates/use-tax-rates-queries'
import { usePnlLabelResolver } from '@/pages/configuration/pnl-terms/use-pnl-labels-queries'
import { Skeleton } from '@/ui/skeleton'

import { calendarYearToDateRange } from './calendar-year-to-date'
import {
  productChannelPlatforms,
  productChannelPnlMetrics,
} from './product-channel-pnl-metrics'
import { estimateTaxByPlatform } from './product-pnl-tax-estimates'
import { ProductPnlTaxMatrix } from './product-pnl-tax-matrix'
import { useProductDetailQuery } from './use-catalog-queries'

type ProductDetailChannelPnlMatrixProps = {
  detail: ProductDetailApi
  t: (key: ShellStringKey) => string
  fmtBase: (value: number) => string
  isFetching?: boolean
}

export function ProductDetailChannelPnlMatrix({
  detail,
  t,
  fmtBase,
  isFetching = false,
}: ProductDetailChannelPnlMatrixProps) {
  const labelForRow = usePnlLabelResolver()
  const taxRatesQuery = useTaxRatesQuery()
  const platforms = useMemo(() => productChannelPlatforms(detail, t), [detail, t])
  const metrics = useMemo(
    () => productChannelPnlMetrics(detail, platforms),
    [detail, platforms],
  )

  const ytdRange = useMemo(() => calendarYearToDateRange(), [])
  const ytdDetailQuery = useProductDetailQuery(detail.id, {
    metricsStart: ytdRange.start,
    metricsEnd: ytdRange.end,
  })
  const yearWithheld = useMemo(() => {
    const rates = taxRatesQuery.data?.settings
    const ytdDetail = ytdDetailQuery.data
    if (!rates || !ytdDetail) return null
    const ytdPlatforms = productChannelPlatforms(ytdDetail, t)
    const ytdMetrics = productChannelPnlMetrics(ytdDetail, ytdPlatforms)
    return estimateTaxByPlatform(ytdMetrics, ytdPlatforms, rates).total.withholding_total
  }, [t, taxRatesQuery.data?.settings, ytdDetailQuery.data])

  if (platforms.length === 0) return null

  if (isFetching) {
    return <Skeleton className="h-48 w-full" aria-hidden />
  }

  return (
    <div className="flex flex-col gap-6">
      <ChannelsPnlTable
        metrics={metrics}
        platforms={platforms}
        formatMoney={fmtBase}
        t={t}
        labelForRow={labelForRow}
        cmIncomplete={detail.cm_incomplete}
        footerMode="units"
      />
      <ProductPnlTaxMatrix
        metrics={metrics}
        platforms={platforms}
        taxRates={taxRatesQuery.data?.settings}
        formatMoney={fmtBase}
        t={t}
        currencyCode={detail.base_currency}
        yearWithheld={yearWithheld}
        yearWithheldLoading={ytdDetailQuery.isFetching}
      />
    </div>
  )
}
