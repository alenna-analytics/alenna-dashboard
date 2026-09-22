import type { AppIconName } from '@/lib/icons/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'

export const ALARMS_BASE_PATH = '/dashboard/alarms'

export type ConfigurableAlarmTypeId = 'stock' | 'match_suggestion'

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
    path: `${ALARMS_BASE_PATH}/stock`,
    icon: 'orders',
  },
  {
    id: 'match_suggestion',
    titleKey: 'alarmsMatchTypeTitle',
    descriptionKey: 'alarmsMatchTypeDescription',
    path: `${ALARMS_BASE_PATH}/match-suggestion`,
    icon: 'products',
  },
] as const
