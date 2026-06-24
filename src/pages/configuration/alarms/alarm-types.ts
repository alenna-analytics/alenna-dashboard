import type { AppIconName } from '@/lib/icons/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'

export type ConfigurableAlarmTypeId = 'stock'

export type ConfigurableAlarmType = {
  id: ConfigurableAlarmTypeId
  titleKey: ShellStringKey
  descriptionKey: ShellStringKey
  path: string
  icon: AppIconName
}

export const CONFIGURABLE_ALARM_TYPES: readonly ConfigurableAlarmType[] = [
  {
    id: 'stock',
    titleKey: 'alarmsStockTypeTitle',
    descriptionKey: 'alarmsStockTypeDescription',
    path: '/dashboard/configuration/alarms/stock',
    icon: 'products',
  },
] as const
