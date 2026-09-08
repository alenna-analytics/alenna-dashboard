import { createContext } from 'react'

import type { GroupInsightDimensionState } from './group-insight-dimension'

export const GroupInsightContext = createContext<GroupInsightDimensionState | null>(null)
