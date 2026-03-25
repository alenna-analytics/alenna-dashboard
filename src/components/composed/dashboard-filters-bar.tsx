import { useMemo } from 'react'

import { ChannelsCombobox } from '@/components/composed/channels-combobox'
import { DatePickerField } from '@/components/composed/date-picker-field'
import { ProductCombobox } from '@/components/composed/product-combobox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { monthOptionsForYear } from '@/lib/dashboard-date-shortcuts'
import type { ProductCandidate } from '@/lib/analytics-types'
import { cn } from '@/lib/utils'

const filterTriggerClass =
  'h-9 min-w-[7.5rem] max-w-[13rem] rounded-[10px] border-border-subtle bg-white/[0.03] text-xs font-medium text-text-secondary shadow-none hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-white/10 dark:border-border-subtle dark:bg-white/[0.03] dark:hover:bg-white/[0.05]'

type SalesChannel = 'shopify' | 'amazon' | 'mercadolibre'

export type DashboardFiltersBarProps = {
  t: (key: string) => string
  locale: string
  startDate: Date
  endDate: Date
  onStartChange: (d: Date) => void
  onEndChange: (d: Date) => void
  shortcutYearValue: string
  yearShortcutOptions: number[]
  onYearShortcut: (year: string) => void
  shortcutMonthValue: string
  referenceYearForMonth: number
  onMonthShortcut: (ym: string) => void
  platforms: SalesChannel[]
  platformLabels: Record<SalesChannel, string>
  selectedPlatforms: SalesChannel[] | undefined
  onTogglePlatform: (p: SalesChannel) => void
  onSelectAllPlatforms: () => void
  productItems: ProductCandidate[]
  productId: string | undefined
  onProductChange: (id: string | undefined) => void
  productCatalogLoading: boolean
  granularity: string
  onGranularityChange: (v: string) => void
}

export function DashboardFiltersBar({
  t,
  locale,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  shortcutYearValue,
  yearShortcutOptions,
  onYearShortcut,
  shortcutMonthValue,
  referenceYearForMonth,
  onMonthShortcut,
  platforms,
  platformLabels,
  selectedPlatforms,
  onTogglePlatform,
  onSelectAllPlatforms,
  productItems,
  productId,
  onProductChange,
  productCatalogLoading,
  granularity,
  onGranularityChange,
}: DashboardFiltersBarProps) {
  const monthItems = useMemo(
    () => monthOptionsForYear(referenceYearForMonth, locale),
    [referenceYearForMonth, locale]
  )

  const yearSelectValue = shortcutYearValue === '' ? null : shortcutYearValue
  const monthSelectValue = shortcutMonthValue === '' ? null : shortcutMonthValue

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
      <DatePickerField
        value={startDate}
        onChange={(d) => d && onStartChange(d)}
        placeholder={t('filterStart')}
      />
      <span className="text-[11px] font-medium text-text-tertiary">{t('filterTo')}</span>
      <DatePickerField
        value={endDate}
        onChange={(d) => d && onEndChange(d)}
        placeholder={t('filterEnd')}
      />

      <div className="flex flex-col gap-1">
        <Label htmlFor="dashboard-shortcut-year" className="sr-only">
          {t('shortcutYear')}
        </Label>
        <Select
          value={yearSelectValue}
          onValueChange={(v) => {
            if (v != null && v !== '') onYearShortcut(v)
          }}
        >
          <SelectTrigger
            id="dashboard-shortcut-year"
            size="sm"
            className={cn(filterTriggerClass, 'min-w-[7.5rem]')}
            aria-label={t('shortcutYear')}
          >
            <SelectValue placeholder={t('shortcutYearPlaceholder')} />
          </SelectTrigger>
          <SelectContent align="start" className="max-h-[min(280px,40dvh)]">
            {yearShortcutOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="dashboard-shortcut-month" className="sr-only">
          {t('shortcutMonth')}
        </Label>
        <Select
          value={monthSelectValue}
          onValueChange={(v) => {
            if (v != null && v !== '') onMonthShortcut(v)
          }}
        >
          <SelectTrigger
            id="dashboard-shortcut-month"
            size="sm"
            className={cn(filterTriggerClass, 'min-w-[10.5rem]')}
            aria-label={t('shortcutMonth')}
          >
            <SelectValue placeholder={t('shortcutMonth')} />
          </SelectTrigger>
          <SelectContent align="start" className="max-h-[min(320px,45dvh)]">
            {monthItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ChannelsCombobox
        platforms={platforms}
        labels={platformLabels}
        selected={selectedPlatforms}
        allSelectedLabel={t('channelsAll')}
        searchPlaceholder={t('searchChannels')}
        onToggle={onTogglePlatform}
        onSelectAll={onSelectAllPlatforms}
      />

      <span className="sr-only">{t('filterProduct')}</span>
      <ProductCombobox
        items={productItems}
        value={productId}
        onChange={onProductChange}
        placeholder={t('filterProduct')}
        allLabel={t('allProducts')}
        searchPlaceholder={t('searchProducts')}
        emptyLabel={t('noProducts')}
        isLoading={productCatalogLoading}
      />

      <div className="ml-auto flex items-center gap-2">
        <Tabs value={granularity} onValueChange={onGranularityChange}>
          <TabsList className="h-9 gap-0.5 rounded-[10px] border border-border-subtle bg-white/[0.03] p-1">
            <TabsTrigger
              value="daily"
              className="h-[calc(100%-2px)] rounded-md px-3 text-xs font-medium data-active:bg-white/[0.07] data-active:shadow-none"
            >
              {t('granularityDaily')}
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              className="h-[calc(100%-2px)] rounded-md px-3 text-xs font-medium data-active:bg-white/[0.07] data-active:shadow-none"
            >
              {t('granularityWeekly')}
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="h-[calc(100%-2px)] rounded-md px-3 text-xs font-medium data-active:bg-white/[0.07] data-active:shadow-none"
            >
              {t('granularityMonthly')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
