import type { ReactNode } from 'react'

import {
  Brush,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

export type ZoomStripDatum = { label: string; __idx: number }

type DashboardZoomStripProps = {
  dataWithIdx: ZoomStripDatum[]
  zoomStart: number
  zoomEnd: number
  onBrushChange: (startIndex: number, endIndex: number) => void
  ariaLabel: string
  miniSeries: ReactNode
}

export function DashboardZoomStrip({
  dataWithIdx,
  zoomStart,
  zoomEnd,
  onBrushChange,
  ariaLabel,
  miniSeries,
}: DashboardZoomStripProps) {
  if (dataWithIdx.length === 0) return null

  const i1 = Math.max(0, Math.min(zoomStart, dataWithIdx.length - 1))
  const i2 = Math.max(i1, Math.min(zoomEnd, dataWithIdx.length - 1))
  const x1Label = dataWithIdx[i1]?.label
  const x2Label = dataWithIdx[i2]?.label

  return (
    <div className="mt-2 rounded-md border border-border-subtle/70 bg-white px-1 py-1">
      <div className="relative h-16 w-full">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataWithIdx} margin={{ top: 4, right: 4, left: 4, bottom: 2 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={['auto', 'auto']} />
              {miniSeries}
              {x1Label !== undefined && x2Label !== undefined ? (
                <ReferenceArea
                  x1={x1Label}
                  x2={x2Label}
                  fill="rgba(0,0,0,0.14)"
                  stroke="rgba(0,0,0,0.28)"
                  strokeWidth={1}
                  ifOverflow="extendDomain"
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataWithIdx} margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="__idx" hide />
              <YAxis hide />
              <Brush
                dataKey="__idx"
                height={62}
                travellerWidth={8}
                stroke="var(--border-default)"
                fill="transparent"
                startIndex={zoomStart}
                endIndex={zoomEnd}
                ariaLabel={ariaLabel}
                onChange={(r) => {
                  if (typeof r?.startIndex !== 'number' || typeof r?.endIndex !== 'number') return
                  onBrushChange(r.startIndex, r.endIndex)
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
