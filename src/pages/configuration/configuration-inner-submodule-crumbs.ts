import { matchPath } from 'react-router-dom'

import { CONFIGURABLE_ALARM_TYPES } from '@/pages/configuration/alarms/alarm-types'
import { WORKSPACE_CONFIG_SUBMODULES } from '@/lib/modules/workspace-config-submodules'
import { shellT } from '@/lib/i18n/shell-strings'
import type { PageBreadcrumbItem } from '@/ui/page-breadcrumb'

const ALARMS_PARENT = WORKSPACE_CONFIG_SUBMODULES.find((submodule) => submodule.id === 'alarms')

export function configurationInnerSubmoduleCrumbs(
  pathname: string,
  lang: string,
): PageBreadcrumbItem[] | null {
  if (!ALARMS_PARENT) return null

  for (const alarmType of CONFIGURABLE_ALARM_TYPES) {
    if (matchPath({ path: alarmType.path, end: true }, pathname) == null) continue
    return [
      {
        label: shellT(lang, 'navWorkspaceConfiguration'),
        to: '/dashboard/configuration/general',
      },
      {
        label: shellT(lang, ALARMS_PARENT.labelKey),
        to: ALARMS_PARENT.path,
      },
      { label: shellT(lang, alarmType.titleKey) },
    ]
  }

  return null
}
