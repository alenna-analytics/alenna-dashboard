import { matchPath } from 'react-router-dom'

import { CONFIGURABLE_ALARM_TYPES } from '@/pages/configuration/alarms/alarm-types'

export function hasConfigurationInnerNav(pathname: string): boolean {
  return CONFIGURABLE_ALARM_TYPES.some(
    (alarmType) => matchPath({ path: alarmType.path, end: true }, pathname) != null,
  )
}
