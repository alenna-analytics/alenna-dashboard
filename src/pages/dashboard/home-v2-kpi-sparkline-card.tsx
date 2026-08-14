import { KpiCard, type KpiCardProps, type KpiSparklinePoint } from '@/ui/kpi-card'

export type HomeV2SparklinePoint = KpiSparklinePoint

export type HomeV2KpiSparklineCardProps = Omit<
  KpiCardProps,
  'showComparison' | 'deltaBesideValue' | 'vsPriorLabel'
>

export function HomeV2KpiSparklineCard(props: HomeV2KpiSparklineCardProps) {
  return (
    <KpiCard
      {...props}
      showComparison={false}
      deltaBesideValue
      sparklinePoints={
        props.sparklinePoints ??
        (props.sparklineValues ?? []).map((value) => ({ label: '', value }))
      }
    />
  )
}
