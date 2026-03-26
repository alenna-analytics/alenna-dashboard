import { useMemo, useState } from 'react'

import { ChannelsCombobox } from '@/components/composed/channels-combobox'
import { DatePickerField } from '@/components/composed/date-picker-field'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { monthOptionsForYear } from '@/lib/dashboard-date-shortcuts'
import type { DashboardStringKey } from '@/lib/dashboard-strings'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, SlidersHorizontalIcon } from 'lucide-react'

const filterTriggerClass =
  '!h-9 min-h-9 min-w-[7.5rem] max-w-[13rem] rounded-[12px] border-border-subtle bg-white/[0.04] px-3 text-xs font-medium text-text-secondary shadow-none transition-colors duration-200 hover:border-accent/25 hover:bg-accent/[0.06] focus-visible:ring-2 focus-visible:ring-accent/30 dark:border-border-subtle dark:bg-white/[0.03]'

type SalesChannel = 'shopify' | 'amazon' | 'mercadolibre'

export type DashboardFiltersBarProps = {
  t: (key: DashboardStringKey) => string
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
  platforms: readonly SalesChannel[]
  platformLabels: Record<SalesChannel, string>
  selectedPlatforms: SalesChannel[] | undefined
  onTogglePlatform: (p: SalesChannel) => void
  onSelectAllPlatforms: () => void
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
  granularity,
  onGranularityChange,
}: DashboardFiltersBarProps) {
  const [moreOpen, setMoreOpen] = useState(false)

  const monthItems = useMemo(
    () => monthOptionsForYear(referenceYearForMonth, locale),
    [referenceYearForMonth, locale]
  )

  const yearSelectValue = shortcutYearValue === '' ? null : shortcutYearValue
  const monthSelectValue = shortcutMonthValue === '' ? null : shortcutMonthValue

  const granularityTabClass =
    'h-[calc(100%-2px)] rounded-md px-3 text-xs font-medium data-active:bg-accent/15 data-active:text-accent-light data-active:shadow-[0_0_12px_rgba(91,140,255,0.2)]'

  return (
    <div
      className={cn(
        'rounded-xl border border-border-subtle/90 bg-bg-elevated/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_0_rgba(91,140,255,0.06)]',
        'backdrop-blur-sm dark:bg-bg-elevated/90'
      )}
    >
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

        <ChannelsCombobox
          platforms={platforms}
          labels={platformLabels}
          selected={selectedPlatforms}
          allSelectedLabel={t('channelsAll')}
          searchPlaceholder={t('searchChannels')}
          onToggle={onTogglePlatform}
          onSelectAll={onSelectAllPlatforms}
        />

        <div className="min-w-[1rem] flex-1" />

        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-[12px] border border-border-subtle bg-white/[0.03] px-3 text-xs font-medium text-text-secondary shadow-none transition-colors hover:border-accent/40 hover:bg-accent/[0.08] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30'
            )}
          >
            <SlidersHorizontalIcon className="size-3.5 opacity-80" aria-hidden />
            {t('filterMoreOptions')}
            <ChevronDownIcon className="size-3.5 opacity-60" aria-hidden />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-[min(100vw-2rem,20rem)] gap-0 border-border-subtle bg-bg-elevated p-0 shadow-xl ring-1 ring-accent/10"
          >
            <div className="border-b border-border-subtle/80 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                {t('filterSecondaryTitle')}
              </p>
            </div>
            <div className="flex flex-col gap-3 p-3">
              <div className="space-y-1.5">
                <Label htmlFor="dashboard-shortcut-year" className="text-[11px] text-text-tertiary">
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
                    className={cn(filterTriggerClass, 'w-full min-w-0')}
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

              <div className="space-y-1.5">
                <Label htmlFor="dashboard-shortcut-month" className="text-[11px] text-text-tertiary">
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
                    className={cn(filterTriggerClass, 'w-full min-w-0')}
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

              <div className="space-y-1.5">
                <span className="text-[11px] text-text-tertiary">{t('filterGranularity')}</span>
                <Tabs value={granularity} onValueChange={onGranularityChange}>
                  <TabsList className="h-9 w-full gap-0.5 rounded-[12px] border border-border-subtle bg-white/[0.03] p-1">
                    <TabsTrigger value="daily" className={cn(granularityTabClass, 'flex-1')}>
                      {t('granularityDaily')}
                    </TabsTrigger>
                    <TabsTrigger value="weekly" className={cn(granularityTabClass, 'flex-1')}>
                      {t('granularityWeekly')}
                    </TabsTrigger>
                    <TabsTrigger value="monthly" className={cn(granularityTabClass, 'flex-1')}>
                      {t('granularityMonthly')}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
