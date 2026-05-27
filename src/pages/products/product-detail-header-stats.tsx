import type { ReactNode } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { Input } from '@/ui/input'
import { cn } from '@/lib/utils'

import {
  formatProductDetailDate,
  formatProductDetailDateTime,
  latestListingSyncIso,
  uniqueActivePlatforms,
} from './product-detail-header-utils'

const NUM = 'font-numeric tabular-nums'

type ProductDetailHeaderStatsProps = {
  detail: ProductDetailApi
  t: (key: ShellStringKey) => string
  lang: string
  skuDraft: string
  onSkuDraftChange: (value: string) => void
}

function StatColumn({
  label,
  children,
  valueClassName,
}: {
  label: string
  children: ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <span className="whitespace-nowrap text-xs text-text-tertiary">{label}</span>
      <div className={cn('text-sm font-semibold text-text-primary', valueClassName)}>{children}</div>
    </div>
  )
}

export function ProductDetailHeaderStats({
  detail,
  t,
  lang,
  skuDraft,
  onSkuDraftChange,
}: ProductDetailHeaderStatsProps) {
  const channelCount = uniqueActivePlatforms(detail.listings).length

  const columns: { key: string; label: string; value: ReactNode; valueClassName?: string }[] = [
    {
      key: 'sku',
      label: t('productsDetailHeaderStatSkuLabel'),
      value: (
        <Input
          value={skuDraft}
          onChange={(e) => onSkuDraftChange(e.target.value)}
          placeholder={t('productsDetailSkuPlaceholder')}
          aria-label={t('productsDetailEditSkuAria')}
          className="h-8 max-w-[11rem] text-sm font-semibold"
        />
      ),
    },
    {
      key: 'channels',
      label: t('productsDetailHeaderStatChannelsLabel'),
      value: channelCount,
      valueClassName: NUM,
    },
    {
      key: 'created',
      label: t('productsDetailHeaderStatCreatedLabel'),
      value: formatProductDetailDate(detail.created_at, lang),
    },
    {
      key: 'updated',
      label: t('productsDetailHeaderStatUpdatedLabel'),
      value: formatProductDetailDateTime(detail.updated_at, lang),
    },
    {
      key: 'sync',
      label: t('productsDetailHeaderStatLastSyncLabel'),
      value: formatProductDetailDateTime(latestListingSyncIso(detail), lang),
    },
  ]

  return (
    <div className="inline-flex max-w-full flex-wrap items-stretch">
      {columns.map((col, index) => (
        <div
          key={col.key}
          className={cn(
            'flex shrink-0',
            index > 0 && 'border-l border-border-subtle pl-4',
            index < columns.length - 1 && 'pr-4',
            col.key === 'sku' && 'min-w-[9rem]',
          )}
        >
          <StatColumn label={col.label} valueClassName={col.valueClassName}>
            {col.value}
          </StatColumn>
        </div>
      ))}
    </div>
  )
}
