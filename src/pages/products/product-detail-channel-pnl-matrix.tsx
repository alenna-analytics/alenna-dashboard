import { useMemo } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { ChannelsPnlTable } from '@/pages/channels/channels-pnl-table'
import { useTaxRatesQuery } from '@/pages/configuration/tax-rates/use-tax-rates-queries'
import { usePnlLabelResolver } from '@/pages/configuration/pnl-terms/use-pnl-labels-queries'
import { Skeleton } from '@/ui/skeleton'

import {
  productChannelPlatforms,
  productChannelPnlMetrics,
} from './product-channel-pnl-metrics'
import { ProductPnlTaxMatrix } from './product-pnl-tax-matrix'

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
      />
    </div>
  )
}
