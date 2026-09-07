import { useMemo } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { ChannelsPnlTable } from '@/pages/channels/channels-pnl-table'
import { usePnlLabelResolver } from '@/pages/configuration/pnl-terms/use-pnl-labels-queries'
import { Skeleton } from '@/ui/skeleton'

import {
  productChannelPlatforms,
  productChannelPnlMetrics,
} from './product-channel-pnl-metrics'

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
    <ChannelsPnlTable
      metrics={metrics}
      platforms={platforms}
      formatMoney={fmtBase}
      t={t}
      labelForRow={labelForRow}
      cmIncomplete={detail.cm_incomplete}
    />
  )
}
