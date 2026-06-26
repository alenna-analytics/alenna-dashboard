export function HomeOnboardingHeroIllustration() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[420px]"
      aria-hidden
    >
      <svg
        viewBox="0 0 420 420"
        className="size-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="home-onb-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#0b2528" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0b2528" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="home-onb-zara" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ecea5d" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ecea5d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="home-onb-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#44695a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0b2528" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        <circle cx="210" cy="210" r="168" fill="url(#home-onb-glow)" />
        <circle cx="300" cy="108" r="92" fill="url(#home-onb-zara)" />

        <path
          d="M88 248 C140 188, 196 196, 248 156 C286 128, 318 118, 352 92"
          stroke="url(#home-onb-line)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M72 168 C118 198, 168 154, 220 188 C266 218, 312 206, 348 248"
          stroke="url(#home-onb-line)"
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.7"
        />

        <rect x="96" y="118" width="148" height="92" rx="12" fill="white" fillOpacity="0.72" />
        <rect x="112" y="136" width="56" height="8" rx="4" fill="#0b2528" fillOpacity="0.12" />
        <rect x="112" y="154" width="108" height="6" rx="3" fill="#44695a" fillOpacity="0.18" />
        <rect x="112" y="170" width="88" height="6" rx="3" fill="#44695a" fillOpacity="0.12" />
        <rect x="112" y="186" width="72" height="6" rx="3" fill="#0b2528" fillOpacity="0.08" />

        <rect x="228" y="214" width="124" height="124" rx="14" fill="white" fillOpacity="0.68" />
        <circle cx="290" cy="276" r="34" stroke="#44695a" strokeOpacity="0.35" strokeWidth="10" />
        <path
          d="M290 242 A34 34 0 0 1 318 286"
          stroke="#0b2528"
          strokeOpacity="0.45"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M290 276 L318 286"
          stroke="#ecea5d"
          strokeOpacity="0.85"
          strokeWidth="10"
          strokeLinecap="round"
        />

        <circle cx="118" cy="292" r="14" fill="#0b2528" fillOpacity="0.85" />
        <circle cx="196" cy="332" r="11" fill="#44695a" fillOpacity="0.75" />
        <circle cx="332" cy="148" r="12" fill="#0b2528" fillOpacity="0.7" />
        <circle cx="356" cy="312" r="9" fill="#ecea5d" fillOpacity="0.9" />
      </svg>
    </div>
  )
}
