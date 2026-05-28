import type { ShellStringKey } from '@/lib/i18n/shell-strings'

export type HomeActiveAlertsKpiLabels = {
  label: string
  helpText: string
  vsPriorLabel: string
  lowLabel: string
  criticalLabel: string
}

export function homeActiveAlertsKpiLabels(
  t: (key: ShellStringKey) => string,
  vsPriorLabel: string,
): HomeActiveAlertsKpiLabels {
  return {
    label: t('homeKpiActiveAlerts'),
    helpText: t('homeKpiActiveAlertsHelp'),
    vsPriorLabel,
    lowLabel: t('homeKpiActiveAlertsLow'),
    criticalLabel: t('homeKpiActiveAlertsCritical'),
  }
}
