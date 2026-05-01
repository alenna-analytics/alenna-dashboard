import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { KpiCard, KpiDeltaPill } from '@/ui/kpi-card'

export function ComponentsShowcasePage() {
  const { lang } = useLanguage()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)

  return (
    <DashboardPage className="flex flex-col gap-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">{t('navComponents')}</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
          KPI cards, delta pills, and layout tokens for the dashboard refactor.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Delta pills</h2>
        <div className="flex flex-wrap items-center gap-3 bg-[var(--bg-base)] p-4">
          <KpiDeltaPill pct={20.5} trend="up" comparisonUnavailable={false} />
          <KpiDeltaPill pct={5.9} trend="down" comparisonUnavailable={false} />
          <KpiDeltaPill pct={0} trend="flat" comparisonUnavailable={false} />
          <KpiDeltaPill pct={null} trend="flat" comparisonUnavailable={false} />
          <KpiDeltaPill pct={null} trend="flat" comparisonUnavailable />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">KPI cards</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            variant="featured"
            label="Net revenue"
            helpText="Primary sales metric for the selected range."
            value="$45,000.00"
            vsPriorLabel="vs. prior period"
            priorValueDisplay="$30,000.00"
            pct={20.5}
            trend="up"
            comparisonUnavailable={false}
          />
          <KpiCard
            label="Gross margin %"
            helpText="Gross profit divided by net revenue."
            value="42.3%"
            vsPriorLabel="vs. prior period"
            priorValueDisplay="38.0%"
            pct={11.3}
            trend="up"
            comparisonUnavailable={false}
          />
          <KpiCard
            label="Orders"
            value="26"
            vsPriorLabel="vs. prior period"
            priorValueDisplay="30"
            pct={13.3}
            trend="down"
            comparisonUnavailable={false}
          />
        </div>
      </section>
    </DashboardPage>
  )
}
