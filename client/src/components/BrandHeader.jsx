// Брендовий хедер: фіолетова плашка з лого-тегом і заголовком.
// На проекторі (big) — композиційні білі дудли справа (навмисно, не розсип).
export default function BrandHeader({ title, right, big, doodles }) {
  return (
    <header
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--accent)',
        color: '#fff',
        borderRadius: 'var(--r-card)',
        padding: big ? '26px 28px' : '18px 22px',
        boxShadow: 'var(--shadow-accent)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        <span
          className="codetag"
          style={{ color: 'color-mix(in srgb, #fff 78%, var(--accent))', fontSize: big ? 15 : 13 }}
        >
          FIT: studrada
        </span>
        <h1 style={{ color: '#fff', margin: '4px 0 0', fontSize: big ? 'clamp(30px,4.4vw,52px)' : 26 }}>
          {title}
        </h1>
      </div>

      {right && (
        <div style={{ position: 'relative', zIndex: 1 }}>{right}</div>
      )}

      {doodles && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <img
            src="/doodles/crown_w.png"
            alt=""
            style={{ position: 'absolute', top: '18%', right: 210, width: 58, opacity: 0.9, transform: 'rotate(-8deg)' }}
          />
          <img
            src="/doodles/bolt_w.png"
            alt=""
            style={{ position: 'absolute', bottom: '12%', right: 132, width: 40, opacity: 0.8, transform: 'rotate(6deg)' }}
          />
          <img
            src="/doodles/code_w.png"
            alt=""
            style={{ position: 'absolute', top: '30%', right: 34, width: 92, opacity: 0.9, transform: 'rotate(4deg)' }}
          />
        </div>
      )}
    </header>
  );
}
