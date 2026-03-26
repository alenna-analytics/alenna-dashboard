export const DASHBOARD_PLATFORMS = ['shopify', 'amazon', 'mercadolibre'] as const

export type DashboardSalesChannel = (typeof DASHBOARD_PLATFORMS)[number]

export const PLATFORM_LABELS: Record<DashboardSalesChannel, string> = {
  shopify: 'Shopify',
  amazon: 'Amazon',
  mercadolibre: 'Mercado Libre',
}

export const COLORS_BY_CHANNEL: Record<DashboardSalesChannel, string> = {
  shopify: '#6b7fd8',
  amazon: '#b89a7a',
  mercadolibre: '#a8a060',
}

const STRINGS = {
  es: {
    pageTitle: 'Dashboard',
    pageDesc: 'Analítica de ingresos y KPIs',

    filterStart: 'Fecha inicio',
    filterEnd: 'Fecha fin',
    filterTo: 'a',
    shortcutYear: 'Año',
    shortcutYearPlaceholder: 'Año…',
    shortcutMonth: 'Mes',
    channels: 'Canales',
    channelsAll: 'Todos los canales',
    searchChannels: 'Buscar canal…',
    filterProduct: 'Producto',
    allProducts: 'Todos los productos',
    searchProducts: 'Buscar producto…',
    noProducts: 'Sin productos',
    productsPickedCount: '{{n}} productos',

    granularityDaily: 'Diario',
    granularityWeekly: 'Semanal',
    granularityMonthly: 'Mensual',

    kpiGross: 'Ventas brutas',
    kpiNet: 'Ventas netas',
    kpiGrossProfit: 'Utilidad bruta',
    kpiMargin: 'Margen',
    kpiReceived: 'Total recibido',

    deltaVsPrev: 'vs periodo anterior',
    deltaVsPrevMonth: 'vs mes anterior',

    wfTitle: 'Cascada P&L',
    donutTitle: 'Participación de ventas por canal',
    monthlyTitle: 'Evolución Mensual — Ingresos · Utilidad · EBITDA · Margen',
    costTitle: 'Estructura de costos por canal y categoría',
    overlayTitle: 'Ventas brutas y netas por canal',
    overlayMonthlyHint: 'Agregación mensual por canal (más legible que el detalle diario).',
    marginTitle: 'Margen % por Canal',

    traceGrossRevenue: 'Ventas brutas',
    traceNetRevenue: 'Ventas netas',
    traceGrossProfit: 'Utilidad bruta',
    traceCostOfSalesTotal: 'Costo de ventas (total)',
    traceCostOfSalesOther: 'Otros costos de ventas',
    tracePnlReconcile: 'Otros ajustes a utilidad bruta',
    wfReconcileFootnote:
      '“Otros ajustes…” aparece solo si la utilidad bruta del archivo no coincide exactamente con ventas netas menos costo de ventas total (redondeo u otras partidas en el origen).',
    traceEbitda: 'EBITDA',
    traceMarginPct: 'Margen %',

    monthlyStackEbitda: 'EBITDA',
    monthlyStackLayerUb: 'Utilidad bruta − EBITDA',
    monthlyStackLayerNet: 'Ventas netas − utilidad bruta',
    monthlyStackLayerGross: 'Ventas brutas − ventas netas',

    costCogs: 'COGS',
    costCommission: 'Comisiones',
    costShipping: 'Envios',
    costAds: 'Ads',

    modalTitle: 'Desglose por canal',
    modalPeriod: 'Periodo',
    modalChannel: 'Canal',
    modalGross: 'Ventas brutas',
    modalNet: 'Ventas netas',
    modalCogs: 'COGS',
    modalCommission: 'Comisiones',
    modalShipping: 'Envios',
    modalAds: 'Ads',
    modalGrossProfit: 'Utilidad bruta',

    legendGross: 'Ventas brutas (menos opacidad)',
    legendNet: 'Ventas netas (más opacidad)',

    productScopeBanner:
      'Vista por producto: los anuncios no se asignan por SKU; la cascada termina en utilidad bruta. Comisiones y envío se prorratean por participación de la línea en el subtotal del pedido.',
  },
  en: {
    pageTitle: 'Dashboard',
    pageDesc: 'Revenue analytics and KPIs',

    filterStart: 'Start date',
    filterEnd: 'End date',
    filterTo: 'to',
    shortcutYear: 'Year',
    shortcutYearPlaceholder: 'Year…',
    shortcutMonth: 'Month',
    channels: 'Channels',
    channelsAll: 'All channels',
    searchChannels: 'Search channel…',
    filterProduct: 'Product',
    allProducts: 'All products',
    searchProducts: 'Search product…',
    noProducts: 'No products',
    productsPickedCount: '{{n}} products',

    granularityDaily: 'Daily',
    granularityWeekly: 'Weekly',
    granularityMonthly: 'Monthly',

    kpiGross: 'Gross sales',
    kpiNet: 'Net sales',
    kpiGrossProfit: 'Gross profit',
    kpiMargin: 'Margin',
    kpiReceived: 'Total received',

    deltaVsPrev: 'vs prior period',
    deltaVsPrevMonth: 'vs prior month',

    wfTitle: 'P&L waterfall',
    donutTitle: 'Share of net sales by channel',
    monthlyTitle: 'Monthly evolution — Revenue · Profit · EBITDA · Margin',
    costTitle: 'Cost structure by channel and category',
    overlayTitle: 'Gross and net sales by channel',
    overlayMonthlyHint: 'Monthly totals per channel (easier to read than daily detail).',
    marginTitle: 'Margin % by channel',

    traceGrossRevenue: 'Gross revenue',
    traceNetRevenue: 'Net revenue',
    traceGrossProfit: 'Gross profit',
    traceCostOfSalesTotal: 'Cost of sales (total)',
    traceCostOfSalesOther: 'Other cost of sales',
    tracePnlReconcile: 'Other adjustments to gross profit',
    wfReconcileFootnote:
      '“Other adjustments…” only appears when reported gross profit does not exactly equal net sales minus total cost of sales (rounding or extra lines in the source data).',
    traceEbitda: 'EBITDA',
    traceMarginPct: 'Margin %',

    monthlyStackEbitda: 'EBITDA',
    monthlyStackLayerUb: 'Gross profit − EBITDA',
    monthlyStackLayerNet: 'Net sales − gross profit',
    monthlyStackLayerGross: 'Gross sales − net sales',

    costCogs: 'COGS',
    costCommission: 'Commissions',
    costShipping: 'Shipping',
    costAds: 'Ads',

    modalTitle: 'Breakdown by channel',
    modalPeriod: 'Period',
    modalChannel: 'Channel',
    modalGross: 'Gross sales',
    modalNet: 'Net sales',
    modalCogs: 'COGS',
    modalCommission: 'Commissions',
    modalShipping: 'Shipping',
    modalAds: 'Ads',
    modalGrossProfit: 'Gross profit',

    legendGross: 'Gross (lower opacity)',
    legendNet: 'Net (higher opacity)',

    productScopeBanner:
      'Product view: ad spend is not allocated to SKUs; the waterfall ends at gross profit. Commission and shipping are prorated by line share of order subtotal.',
  },
} as const

export type DashboardStringKey = keyof typeof STRINGS.es

export function dashboardT(lang: string, key: DashboardStringKey): string {
  const locale = lang === 'en' ? 'en' : 'es'
  const table = STRINGS[locale]
  return table[key] ?? key
}
