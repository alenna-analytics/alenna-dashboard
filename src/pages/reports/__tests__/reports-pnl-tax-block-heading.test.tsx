import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { TaxesEstimated } from '@/lib/types/reports'
import { ReportsPnlTaxBlock } from '@/pages/reports/reports-pnl-tax-block'

const taxes: TaxesEstimated = {
  withholding_isr: 25099.84,
  withholding_iva: 88394.7,
  withholding_total: 113393.04,
  transferred_iva: 0,
  expected_net_cash: 511223.32,
  base_amount: 1000000,
  base_field: 'gross_revenue',
  formula_version: 'v1',
  settings: {
    withholding_iva_pct: 8,
    withholding_isr_pct: 2.5,
    transferred_iva_pct: 0,
  },
}

const t = (key: ShellStringKey) => key

describe('ReportsPnlTaxBlock heading', () => {
  it('uses the withholdings title in the large section header', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ReportsPnlTaxBlock taxesEstimated={taxes} formatMoney={String} t={t} />
      </MemoryRouter>,
    )
    expect(html).toContain('reportsTaxBlockTitle')
    expect(html).toContain('reportsTaxBlockSubtitle')
    expect(html).not.toContain('reportsPnlTableTitle')
    expect(html).not.toContain('reportsPnlTableSubtitle')
  })
})
