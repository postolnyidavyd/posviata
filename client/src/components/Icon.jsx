// Єдиний набір лінійних іконок (stroke=currentColor, один вес). Без емодзі.
const P = {
  play: <path d="M6 4l14 8-14 8z" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </>
  ),
  reset: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  award: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M9 14.5 8 22l4-2.5L16 22l-1-7.5" />
    </>
  ),
  crown: <path d="M3 18l2-11 5 6 2-8 2 8 5-6 2 11z" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  next: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M4 12l5 5L20 6" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  spin: <path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v5h-5" />,
};

export default function Icon({ name, size = 18, strokeWidth = 2, style }) {
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
      style={{ flexShrink: 0, ...style }}
      aria-hidden
    >
      {P[name]}
    </svg>
  );
}
