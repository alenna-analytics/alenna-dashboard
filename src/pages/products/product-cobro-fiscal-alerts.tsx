import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { ContextAlertCard } from '@/ui/context-alert'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { Skeleton } from '@/ui/skeleton'

type ShellT = (key: ShellStringKey) => string

type ProductCobroFiscalAlertsProps = {
  t: ShellT
  formatMoney: (value: number) => string
  currencyCode?: string
  /** Period withheld total (current filters). */
  periodWithheld: number
  /** Calendar-year estimated withheld total. */
  yearWithheld?: number | null
  yearWithheldLoading?: boolean
  /** Show Shopify marketplace explanation. */
  showShopifyAlert?: boolean
  /** Also show the “does not affect profitability” tip. */
  showRetentionTip?: boolean
}

function moneyWithCurrency(
  formatMoney: (value: number) => string,
  amount: number,
  currencyCode?: string,
): string {
  const formatted = formatMoney(Math.abs(amount))
  return currencyCode ? `${formatted} ${currencyCode}` : formatted
}

export function ProductCobroFiscalAlerts({
  t,
  formatMoney,
  currencyCode,
  periodWithheld,
  yearWithheld = null,
  yearWithheldLoading = false,
  showShopifyAlert = false,
  showRetentionTip = true,
}: ProductCobroFiscalAlertsProps) {
  const [yearOpen, setYearOpen] = useState(false)
  const periodLabel = moneyWithCurrency(formatMoney, periodWithheld, currencyCode)
  const yearLabel = useMemo(() => {
    if (yearWithheld == null) return null
    return moneyWithCurrency(formatMoney, yearWithheld, currencyCode)
  }, [currencyCode, formatMoney, yearWithheld])

  const creditTitle = t('productsDetailCobroFiscalCreditAlert').replace(
    '{amount}',
    periodLabel,
  )

  return (
    <>
      {showShopifyAlert ? (
        <ContextAlertCard
          title={t('productsDetailCobroShopifyNoTaxAlert')}
          icon={Info}
          tone="info"
          action={
            <Link
              to="/dashboard/configuration/tax-rates"
              className="text-xs font-medium text-text-primary underline-offset-2 hover:underline"
            >
              {t('productsDetailCobroShopifyTaxSettingsLink')}
            </Link>
          }
        />
      ) : null}

      {periodWithheld > 0 ? (
        <ContextAlertCard
          title={creditTitle}
          subtitle={t('productsDetailCobroFiscalCreditAlertHint')}
          icon={Info}
          tone="info"
          action={
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="px-2.5"
              onClick={() => setYearOpen(true)}
            >
              {t('productsDetailCobroFiscalCreditAlertLink')}
            </Button>
          }
        />
      ) : null}

      {showRetentionTip ? (
        <ContextAlertCard
          title={t('productsDetailTaxRetentionAlert').replace('{amount}', periodLabel)}
          subtitle={t('productsDetailTaxRetentionAlertHint')}
          icon={Info}
          tone="info"
        />
      ) : null}

      <Dialog open={yearOpen} onOpenChange={setYearOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('productsDetailCobroFiscalYearModalTitle')}</DialogTitle>
            <DialogDescription>
              {t('productsDetailCobroFiscalYearModalDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-1">
            <div className="rounded-md border border-border-subtle px-4 py-3">
              <p className="text-xs text-text-tertiary">
                {t('productsDetailCobroFiscalYearModalPeriodLabel')}
              </p>
              <p className="mt-1 font-numeric text-lg tabular-nums text-text-primary">
                {periodLabel}
              </p>
            </div>
            <div className="rounded-md border border-border-subtle px-4 py-3">
              <p className="text-xs text-text-tertiary">
                {t('productsDetailCobroFiscalYearModalYtdLabel')}
              </p>
              {yearWithheldLoading ? (
                <Skeleton className="mt-2 h-7 w-36" aria-hidden />
              ) : (
                <p className="mt-1 font-numeric text-lg tabular-nums text-text-primary">
                  {yearLabel ?? t('productsDetailKpiNoData')}
                </p>
              )}
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">
              {t('productsDetailCobroFiscalYearModalFootnote')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
