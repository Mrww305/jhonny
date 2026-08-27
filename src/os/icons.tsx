import React from "react";

export type IconName =
  | "radar"
  | "wave"
  | "globe"
  | "shield"
  | "bolt"
  | "candle"
  | "plug"
  | "copy"
  | "check"
  | "play"
  | "pause"
  | "power"
  | "x"
  | "terminal"
  | "link"
  | "flow"
  | "pulse"
  | "target"
  | "sat"
  | "crosshair"
  | "layers"
  | "arrow";

const paths: Record<IconName, React.ReactNode> = {
  radar: (
    <>
      <path d="M12 12 19 5.5" />
      <path d="M4.5 12a7.5 7.5 0 1 0 7.5-7.5" />
      <path d="M8 12a4 4 0 1 0 4-4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  wave: (
    <>
      <path d="M2.5 12h3l2.5-6 3.5 12 3-8 2 4 1.5-2h3.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c-2.8 2.6-4 5.4-4 8.5s1.2 5.9 4 8.5c2.8-2.6 4-5.4 4-8.5s-1.2-5.9-4-8.5Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 5 6v6c0 4.4 3 7.6 7 8.5 4-.9 7-4.1 7-8.5V6l-7-2.5Z" />
      <path d="m9 12 2.2 2.2L15.5 9.5" />
    </>
  ),
  bolt: <path d="M13 2.5 5 13.5h5.5L10 21.5l8-11h-5.5l.5-8Z" />,
  candle: (
    <>
      <path d="M6 4v4M6 16v4M6 8h0" />
      <rect x="4.2" y="8" width="3.6" height="8" />
      <path d="M18 3v3M18 14v4" />
      <rect x="16.2" y="6" width="3.6" height="8" />
      <path d="M12 6v2M12 17v2" />
      <rect x="10.2" y="8" width="3.6" height="9" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3.5V8M15 3.5V8" />
      <path d="M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0V8Z" />
      <path d="M12 17v3.5" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
      <path d="M5.5 14.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5L19.5 6.5" />,
  play: <path d="M7 4.5v15l12-7.5L7 4.5Z" />,
  pause: <path d="M8 4.5v15M16 4.5v15" />,
  power: (
    <>
      <path d="M12 3v8" />
      <path d="M6.3 6.5a8 8 0 1 0 11.4 0" />
    </>
  ),
  x: <path d="m6 6 12 12M18 6 6 18" />,
  terminal: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <path d="m7 9.5 3.5 3L7 15.5M12.5 15.5H17" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.6 1.6" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.6-1.6" />
    </>
  ),
  flow: (
    <>
      <circle cx="5.5" cy="6" r="2.5" />
      <circle cx="18.5" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M8 6h8M6.8 8.2 10.8 16M17.2 8.2 13.2 16" />
    </>
  ),
  pulse: <path d="M2.5 12h4l2.5-6.5 3.5 13 3-9 1.5 2.5h4.5" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  sat: (
    <>
      <path d="m9 7 8 8M13 3l8 8-3.5 3.5L9.5 6.5 13 3Z" />
      <path d="M6.5 9.5A7.5 7.5 0 0 0 3 16c0 1 .2 2 .7 2.8M9.5 6.5A11 11 0 0 0 3 16" />
      <circle cx="7.5" cy="16.5" r="1.2" />
    </>
  ),
  crosshair: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 2.5V7M12 17v4.5M2.5 12H7M17 12h4.5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3.5 8.5 4.5L12 12.5 3.5 8 12 3.5Z" />
      <path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" />
    </>
  ),
  arrow: <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" />,
};

export function Icon({
  name,
  size = 16,
  className = "",
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
