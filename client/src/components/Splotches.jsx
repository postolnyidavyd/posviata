// Фіолетові плями по кутах: ліва верхня (делікатна) і права нижня (велика,
// кутова — щільна в куті, згасає всередину). Під контентом.
const BLOBS = [
  // ↖ ліва верхня — делікатна, кругла, бере верхній лівий кут
  {
    style: { top: -100, left: -100, width: 300, height: 280, opacity: 0.18 },
    mask: 'radial-gradient(closest-side, #000 44%, transparent 100%)',
  },
  // ↘ права нижня — покриває кут, менша
  {
    style: { bottom: 0, right: 0, width: 400, height: 290, opacity: 0.92 },
    mask: 'radial-gradient(120% 120% at 90% 100%, #000 34%, transparent 66%)',
  },
];

export default function Splotches() {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      {BLOBS.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            ...b.style,
            background: 'var(--accent)',
            WebkitMaskImage: b.mask,
            maskImage: b.mask,
          }}
        />
      ))}
      {/* невеликий білий дудл на правій нижній плямі */}
      <img
        src="/doodles/code_w.png"
        alt=""
        style={{ position: 'fixed', bottom: 34, right: 48, width: 58, opacity: 0.95, transform: 'rotate(4deg)' }}
      />
    </div>
  );
}
