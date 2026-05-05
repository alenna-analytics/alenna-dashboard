const SPINNER_R = 22.5
const SPINNER_C = 2 * Math.PI * SPINNER_R
const SPINNER_ARC = SPINNER_C * 0.28

type BootSpinnerProps = {
  className?: string
  'aria-label'?: string
}

/** Same circular spinner as the app boot screen; uses `boot-spin` from index.css */
export function BootSpinner({ className = 'size-[52px]', 'aria-label': ariaLabel }: BootSpinnerProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      <circle
        cx="26"
        cy="26"
        r={SPINNER_R}
        stroke="var(--border-subtle)"
        strokeWidth="3"
        fill="none"
      />
      <g
        className="motion-safe:[animation:boot-spin_0.88s_cubic-bezier(0.45,0.05,0.2,1)_infinite] motion-reduce:animate-none"
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
      >
        <circle
          cx="26"
          cy="26"
          r={SPINNER_R}
          stroke="var(--brand)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${SPINNER_ARC} ${SPINNER_C - SPINNER_ARC}`}
          fill="none"
          transform="rotate(-90 26 26)"
        />
      </g>
    </svg>
  )
}
