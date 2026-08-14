import type { ShellStringKey } from '@/lib/i18n/shell-strings'

import { useMoney } from '@/hooks/use-money'
import { KpiCard, SectionContainer, SectionHeader } from '@/pages/reports/report-ui'

type SalesQualityBlockProps = {
  grossRevenue: number
  discounts: number
  returns: number
  unitsSold: number
  orderCount: number
  prevGrossRevenue: number | undefined
  prevDiscounts: number | undefined
  prevReturns: number | undefined
  prevUnitsSold: number | undefined
  prevOrderCount: number | undefined
  currency: string
  previousReady: boolean
  vsPrior: string
  comparisonUnavailable: string
  t: (k: ShellStringKey) => string
}

function shareOfGross(part: number, gross: number): number | null {
  if (gross <= 0) return null
  return (part / gross) * 100
}

function unitsPerOrder(units: number, orders: number): number | null {
  if (orders <= 0) return null
  return units / orders
}

export function SalesQualityBlock({
  grossRevenue,
  discounts,
  returns,
  unitsSold,
  orderCount,
  prevGrossRevenue,
  prevDiscounts,
  prevReturns,
  prevUnitsSold,
  prevOrderCount,
  currency,
  previousReady,
  vsPrior,
  comparisonUnavailable,
  t,
}: SalesQualityBlockProps) {
  const { format: formatMoney } = useMoney()
  const fmt = (v: number) => formatMoney(v, { nativeCurrency: currency })

  const discountRate = shareOfGross(discounts, grossRevenue)
  const returnRate = shareOfGross(returns, grossRevenue)
  const upo = unitsPerOrder(unitsSold, orderCount)

  const prevDiscountRate =
    prevGrossRevenue !== undefined && prevDiscounts !== undefined
      ? shareOfGross(prevDiscounts, prevGrossRevenue)
      : undefined
  const prevReturnRate =
    prevGrossRevenue !== undefined && prevReturns !== undefined
      ? shareOfGross(prevReturns, prevGrossRevenue)
      : undefined
  const prevUpo =
    prevUnitsSold !== undefined && prevOrderCount !== undefined
      ? unitsPerOrder(prevUnitsSold, prevOrderCount)
      : undefined

  return (
    <SectionContainer>
      <SectionHeader
        title={t('salesQualityTitle')}
        description={t('salesQualitySubtitle')}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label={t('salesQualityDiscountRate')}
          helpText={t('salesQualityHelpDiscountRate')}
          value={discountRate ?? 0}
          format="percent"
          currency={currency}
          previous={prevDiscountRate ?? undefined}
          previousReady={previousReady && prevDiscountRate !== null && prevDiscountRate !== undefined}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          negative
          displayValue={discountRate === null ? '—' : undefined}
          showVsPrior={discountRate !== null}
          footer={
            <p className="text-xs text-text-tertiary">
              {t('reportsWfDiscounts')}: {fmt(-discounts)}
            </p>
          }
        />
        <KpiCard
          label={t('salesQualityReturnRate')}
          helpText={t('salesQualityHelpReturnRate')}
          value={returnRate ?? 0}
          format="percent"
          currency={currency}
          previous={prevReturnRate ?? undefined}
          previousReady={previousReady && prevReturnRate !== null && prevReturnRate !== undefined}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          negative
          displayValue={returnRate === null ? '—' : undefined}
          showVsPrior={returnRate !== null}
          footer={
            <p className="text-xs text-text-tertiary">
              {t('reportsWfReturns')}: {fmt(-returns)}
            </p>
          }
        />
        <KpiCard
          label={t('salesQualityUnitsPerOrder')}
          helpText={t('salesQualityHelpUnitsPerOrder')}
          value={upo ?? 0}
          format="count"
          currency={currency}
          previous={prevUpo ?? undefined}
          previousReady={previousReady && prevUpo !== null && prevUpo !== undefined}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          displayValue={upo === null ? '—' : upo.toFixed(2)}
          showVsPrior={upo !== null}
        />
      </div>
    </SectionContainer>
  )
}
