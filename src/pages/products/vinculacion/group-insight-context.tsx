import type { ReactNode } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkGroupApi } from '@/lib/types/product-links'

import { GroupInsightContext } from './group-insight-context-value'
import { useGroupInsightDimension } from './group-insight-dimension'

type ShellT = (key: ShellStringKey) => string

export function GroupInsightProvider({
  group,
  t,
  children,
}: {
  group: ProductLinkGroupApi
  t: ShellT
  children: ReactNode
}) {
  const insight = useGroupInsightDimension(group, t)
  return <GroupInsightContext.Provider value={insight}>{children}</GroupInsightContext.Provider>
}
