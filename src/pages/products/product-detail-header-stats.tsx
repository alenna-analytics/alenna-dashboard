import type { ReactNode } from 'react'

import { Link } from 'react-router-dom'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { Input } from '@/ui/input'
import { AppIcon } from '@/ui/app-icon'
import { StatusPill } from '@/ui/status-pill'
import { cn } from '@/lib/utils'

import {
  formatProductDetailDate,
  formatProductDetailDateTime,
  latestListingSyncIso,
  uniqueActivePlatforms,
} from './product-detail-header-utils'
import { productsLinkingGroupPath } from './products-inner-nav'

type ProductDetailHeaderStatsProps = {
  detail: ProductDetailApi
  t: (key: ShellStringKey) => string
  lang: string
  skuDraft: string
  onSkuDraftChange?: (value: string) => void
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
      <div
        className={cn(
          'flex min-h-8 items-center text-sm font-normal text-text-primary',
          valueClassName,
        )}
      >
        {children}
      </div>
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
          onChange={(e) => onSkuDraftChange?.(e.target.value)}
          readOnly={!onSkuDraftChange}
          disabled={!onSkuDraftChange}
          placeholder={t('productsDetailSkuPlaceholder')}
          aria-label={t('productsDetailEditSkuAria')}
          className="h-8 w-full max-w-none text-sm font-normal sm:max-w-[11rem]"
        />
      ),
    },
    {
      key: 'channels',
      label: t('productsDetailHeaderStatChannelsLabel'),
      value: channelCount,
      valueClassName: 'tabular-nums',
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
      value: (() => {
        const syncIso = latestListingSyncIso(detail)
        return syncIso ? formatProductDetailDateTime(syncIso, lang) : '—'
      })(),
    },
  ]

  if (detail.link_group_id) {
    const groupTitle = detail.link_group_title?.trim() || t('productsVinculacionHubCrumb')
    columns.push({
      key: 'group',
      label: t('productsDetailHeaderStatGroupLabel'),
      value: (
        <Link to={productsLinkingGroupPath(detail.link_group_id)} className="max-w-[14rem]">
          <StatusPill variant="info" className="max-w-full">
            <AppIcon name="integrations" colorize className="size-3" />
            <span className="truncate">{groupTitle}</span>
          </StatusPill>
        </Link>
      ),
    })
  }

  return (
    <div className="grid w-full grid-cols-2 gap-x-4 gap-y-4 sm:inline-flex sm:max-w-full sm:flex-wrap sm:items-stretch">
      {columns.map((col, index) => (
        <div
          key={col.key}
          className={cn(
            'flex shrink-0',
            col.key === 'sku' && 'col-span-2 sm:col-span-1 sm:min-w-[9rem]',
            index > 0 && 'sm:border-l sm:border-border-subtle sm:pl-6',
            index < columns.length - 1 && (col.key === 'sku' ? 'sm:pr-6' : 'sm:pr-5'),
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
