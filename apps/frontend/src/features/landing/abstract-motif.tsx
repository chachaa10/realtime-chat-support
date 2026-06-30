export function AbstractMotif() {
  return (
    <svg
      viewBox="0 0 600 600"
      fill="none"
      className="mx-auto h-auto w-full max-w-[28rem]"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="300" cy="300" r="280" fill="url(#glow)" />

      <circle
        cx="300"
        cy="180"
        r="64"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        fill="currentColor"
        fillOpacity="0.04"
      />
      <circle
        cx="160"
        cy="340"
        r="48"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.25"
        fill="currentColor"
        fillOpacity="0.03"
      />
      <circle
        cx="440"
        cy="340"
        r="48"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.25"
        fill="currentColor"
        fillOpacity="0.03"
      />
      <circle
        cx="230"
        cy="440"
        r="36"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.2"
        fill="currentColor"
        fillOpacity="0.02"
      />
      <circle
        cx="370"
        cy="440"
        r="36"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.2"
        fill="currentColor"
        fillOpacity="0.02"
      />

      <line
        x1="236"
        y1="180"
        x2="208"
        y2="340"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.15"
      />
      <line
        x1="364"
        y1="180"
        x2="392"
        y2="340"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.15"
      />
      <line
        x1="160"
        y1="340"
        x2="230"
        y2="440"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.12"
      />
      <line
        x1="440"
        y1="340"
        x2="370"
        y2="440"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.12"
      />
      <line
        x1="236"
        y1="180"
        x2="364"
        y2="180"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.1"
      />

      <circle cx="300" cy="180" r="20" fill="currentColor" fillOpacity="0.12" />
      <circle cx="160" cy="340" r="12" fill="currentColor" fillOpacity="0.10" />
      <circle cx="440" cy="340" r="12" fill="currentColor" fillOpacity="0.10" />
      <circle cx="230" cy="440" r="8" fill="currentColor" fillOpacity="0.08" />
      <circle cx="370" cy="440" r="8" fill="currentColor" fillOpacity="0.08" />

      <path
        d="M440 340 Q480 270 440 200"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.08"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M160 340 Q120 270 160 200"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.08"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M230 440 Q160 480 120 440"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.06"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M370 440 Q440 480 480 440"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.06"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
