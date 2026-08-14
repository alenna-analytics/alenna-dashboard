type UsageProgressRingProps = {
  ratio: number | null
  label: string
}

const SIZE = 22
const STROKE = 2.5
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function UsageProgressRing({ ratio, label }: UsageProgressRingProps) {
  const filled = ratio ?? 0
  const offset = CIRCUMFERENCE * (1 - filled)
  const pct = ratio == null ? null : Math.round(ratio * 100)

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="shrink-0 -rotate-90"
      aria-label={pct == null ? label : `${label}: ${pct}%`}
      role="img"
    >
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="var(--border-emphasis)"
        strokeWidth={STROKE}
      />
      {filled > 0 ? (
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--country-green-base)"
          strokeWidth={STROKE}
          strokeLinecap="butt"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      ) : null}
    </svg>
  )
}
