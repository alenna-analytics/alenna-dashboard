import { useContext } from 'react'

import { GroupInsightContext } from './group-insight-context-value'
import type { GroupInsightDimensionState } from './group-insight-dimension'

export function useGroupInsight(): GroupInsightDimensionState {
  const insight = useContext(GroupInsightContext)
  if (!insight) {
    throw new Error('useGroupInsight must be used within GroupInsightProvider')
  }
  return insight
}
