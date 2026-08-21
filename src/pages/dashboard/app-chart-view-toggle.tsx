import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  SeriesChartViewToggle,
  ShareChartViewToggle,
  type SeriesChartView,
  type ShareChartView,
} from '@/ui/chart-view-toggle'

type Translate = (key: ShellStringKey) => string

type AppSeriesChartViewToggleProps = {
  value: SeriesChartView
  onChange: (next: SeriesChartView) => void
  t: Translate
}

export function AppSeriesChartViewToggle({
  value,
  onChange,
  t,
}: AppSeriesChartViewToggleProps) {
  return (
    <SeriesChartViewToggle
      value={value}
      onChange={onChange}
      lineLabel={t('homeChartViewLine')}
      barLabel={t('homeChannelChartViewBar')}
    />
  )
}

type AppShareChartViewToggleProps = {
  value: ShareChartView
  onChange: (next: ShareChartView) => void
  t: Translate
}

export function AppShareChartViewToggle({
  value,
  onChange,
  t,
}: AppShareChartViewToggleProps) {
  return (
    <ShareChartViewToggle
      value={value}
      onChange={onChange}
      barLabel={t('homeChannelChartViewBar')}
      pieLabel={t('homeChannelChartViewPie')}
    />
  )
}

export type { SeriesChartView, ShareChartView }
