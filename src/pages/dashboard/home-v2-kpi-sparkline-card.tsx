import { KpiCard, type KpiCardProps, type KpiSparklinePoint } from '@/ui/kpi-card'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'

export type HomeV2SparklinePoint = KpiSparklinePoint

export type HomeV2KpiSparklineCardProps = Omit<
  KpiCardProps,
  'showComparison' | 'deltaBesideValue' | 'vsPriorLabel'
>

export function HomeV2KpiSparklineCard(props: HomeV2KpiSparklineCardProps) {
  const { lang } = useLanguage()
  return (
    <KpiCard
      {...props}
      showComparison={false}
      deltaBesideValue
      sparklineExpandLabel={shellT(lang, 'homeKpiSparklineExpand')}
      sparklineCollapseLabel={shellT(lang, 'homeKpiSparklineCollapse')}
      sparklinePoints={
        props.sparklinePoints ??
        (props.sparklineValues ?? []).map((value) => ({ label: '', value }))
      }
    />
  )
}
