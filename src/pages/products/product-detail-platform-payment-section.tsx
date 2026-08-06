import { useMemo, useState } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import type { DateRangePickerStrings } from '@/ui/date-range-picker'
import { Card, CardContent } from '@/ui/card'
import { DateRangePicker } from '@/ui/date-range-picker'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import type { FilterOption } from '@/ui/filters/types'
import { Skeleton } from '@/ui/skeleton'

import { ProductPlatformLogoName } from './product-platform-logo-name'
import {
  listingCountByPlatform,
  platformSettlementFilterOptions,
  resolveProductPlatformSettlement,
} from './product-detail-settlement-by-platform'
import { productPlatformLabel } from './product-platform-label'
import { SettlementWaterfallList } from './settlement-waterfall-list'

const ALL_CHANNELS = 'all'

type ProductDetailPlatformPaymentSectionProps = {
  detail: ProductDetailApi
  isFetching: boolean
  t: (key: ShellStringKey) => string
  fmtBase: (value: number) => string
  insightStart: string
  insightEnd: string
  setInsightStart: (value: string) => void
  setInsightEnd: (value: string) => void
  pickerStrings: DateRangePickerStrings
}

export function ProductDetailPlatformPaymentSection({
  detail,
  isFetching,
  t,
  fmtBase,
  insightStart,
  insightEnd,
  setInsightStart,
  setInsightEnd,
  pickerStrings,
}: ProductDetailPlatformPaymentSectionProps) {
  const platformSlugs = useMemo(
    () =>
      platformSettlementFilterOptions(detail.period_settlement_by_platform, detail.listings),
    [detail.period_settlement_by_platform, detail.listings],
  )

  const [channelFilter, setChannelFilter] = useState(ALL_CHANNELS)

  const activeChannel =
    channelFilter === ALL_CHANNELS || platformSlugs.includes(channelFilter)
      ? channelFilter
      : ALL_CHANNELS

  const channelOptions = useMemo((): FilterOption[] => {
    const allOption: FilterOption = {
      value: ALL_CHANNELS,
      label: t('homeFilterChannelsAll'),
    }
    const platformOptions = platformSlugs.map((slug) => {
      const sourceSlug =
        detail.period_settlement_by_platform.find(
          (row) => row.platform.trim().toLowerCase() === slug,
        )?.platform ??
        detail.listings.find((listing) => listing.platform.trim().toLowerCase() === slug)
          ?.platform ??
        slug
      return {
        value: slug,
        label: productPlatformLabel(sourceSlug, t),
      }
    })
    return [allOption, ...platformOptions]
  }, [detail.listings, detail.period_settlement_by_platform, platformSlugs, t])

  const settlement = useMemo(
    () =>
      resolveProductPlatformSettlement({
        channelFilter: activeChannel,
        periodSettlement: detail.period_settlement,
        periodSettlementByPlatform: detail.period_settlement_by_platform,
        listings: detail.listings,
      }),
    [
      activeChannel,
      detail.listings,
      detail.period_settlement,
      detail.period_settlement_by_platform,
    ],
  )

  const listingCount =
    activeChannel === ALL_CHANNELS
      ? detail.listings.filter((listing) => listing.period_settlement !== null).length
      : listingCountByPlatform(detail.listings, activeChannel)

  const selectedPlatformSlug = activeChannel === ALL_CHANNELS ? null : activeChannel
  const selectedPlatformLabel =
    selectedPlatformSlug === null
      ? t('homeFilterChannelsAll')
      : productPlatformLabel(
          detail.period_settlement_by_platform.find(
            (row) => row.platform.trim().toLowerCase() === selectedPlatformSlug,
          )?.platform ??
            detail.listings.find(
              (listing) => listing.platform.trim().toLowerCase() === selectedPlatformSlug,
            )?.platform ??
            selectedPlatformSlug,
          t,
        )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <DateRangePicker
          strings={pickerStrings}
          startValue={insightStart}
          endValue={insightEnd}
          onStartChange={(value) => value && setInsightStart(value)}
          onEndChange={(value) => value && setInsightEnd(value)}
          className="w-full max-w-md"
        />
        <FilterComboboxSingle
          label={t('homeFilterChannels')}
          options={channelOptions}
          value={activeChannel}
          onValueChange={setChannelFilter}
          searchPlaceholder={t('homeFilterChannelsSearch')}
          emptyLabel={t('homeFilterChannelsEmpty')}
          allowClear={false}
          triggerClassName="w-full sm:w-auto sm:min-w-[12rem]"
        />
      </div>

      {isFetching ? (
        <Card size="sm" className="border-border-subtle">
          <CardContent className="space-y-3 py-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : settlement ? (
        <Card size="sm" className="border-border-subtle">
          <CardContent className="space-y-3 py-4">
            <div className="space-y-1 border-b border-border-subtle/80 pb-3">
              {selectedPlatformSlug ? (
                <ProductPlatformLogoName
                  platformSlug={selectedPlatformSlug}
                  t={t}
                  className="text-sm font-medium text-text-primary"
                />
              ) : (
                <p className="text-sm font-medium text-text-primary">{selectedPlatformLabel}</p>
              )}
              {listingCount > 0 ? (
                <p className="text-xs text-text-tertiary">
                  {t('productsDetailPlatformPaymentListingCount').replace(
                    '{count}',
                    String(listingCount),
                  )}
                </p>
              ) : null}
            </div>
            <SettlementWaterfallList settlement={settlement} fmtBase={fmtBase} t={t} />
          </CardContent>
        </Card>
      ) : (
        <p className="py-8 text-center text-sm text-text-tertiary">
          {t('productsDetailPlatformPaymentEmpty')}
        </p>
      )}
    </div>
  )
}
