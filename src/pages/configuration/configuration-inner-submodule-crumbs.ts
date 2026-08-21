import { matchPath } from 'react-router-dom'

import {
  ALARMS_BASE_PATH,
  CONFIGURABLE_ALARM_TYPES,
} from '@/pages/configuration/alarms/alarm-types'
import { shellT } from '@/lib/i18n/shell-strings'
import type { PageBreadcrumbItem } from '@/ui/page-breadcrumb'

export function configurationInnerSubmoduleCrumbs(
  pathname: string,
  lang: string,
): PageBreadcrumbItem[] | null {
  for (const alarmType of CONFIGURABLE_ALARM_TYPES) {
    if (matchPath({ path: alarmType.path, end: true }, pathname) == null) continue
    return [
      {
        label: shellT(lang, 'navAlarms'),
        to: ALARMS_BASE_PATH,
      },
      { label: shellT(lang, alarmType.titleKey) },
    ]
  }

  return null
}
