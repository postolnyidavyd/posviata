import { useEffect, useRef, useState } from 'react';

// Візуал колеса: крутиться і зупиняється на секторі, куди випало.
// Сектори (за годинниковою від верху): 0=Mac, 1=Linux, 2=Windows.
export default function WheelStage({ state }) {
  const w = state.wheel || {};
  const teams = state.teams || [];
  const [rotation, setRotation] = useState(0);
  const lastSpin = useRef(0);

  const seg = teams.length ? 360 / teams.length : 120; // кут сектора (2 команди -> 180°)

  useEffect(() => {
    if (w.spinId && w.spinId !== lastSpin.current && w.result != null) {
      lastSpin.current = w.spinId;
      const center = w.result * seg + seg / 2; // центр сектора команди
      const targetMod = (360 - center + 360) % 360;
      setRotation((prev) => {
        const curMod = ((prev % 360) + 360) % 360;
        const delta = (targetMod - curMod + 360) % 360;
        return prev + 8 * 360 + delta; // 8 повних обертів + доводка (довший спін)
      });
    }
  }, [w.spinId, w.result, seg]);

  const remaining = (w.total ?? 0) - (w.counts || []).reduce((a, b) => a + b, 0);
  const landed = !w.spinning && w.result != null ? teams[w.result] : null;

  // конік-градієнт із секторів команд (адаптується під 2 або 3 команди)
  const conic = `conic-gradient(${teams
    .map((t, i) => `var(--${t.os}) ${i * seg}deg ${(i + 1) * seg}deg`)
    .join(', ')})`;

  return (
    <div className={`card ${landed ? `team-${landed.os}` : ''}`} style={{ display: 'grid', gap: 18, justifyItems: 'center', padding: 28 }}>
      <span className="label">Шляпа розподілу</span>
      <div style={{ display: 'grid', justifyItems: 'center' }}>
        <div className="wheel-pointer" />
        <div
          className={`wheel ${landed ? 'landed' : ''}`}
          style={{ transform: `rotate(${rotation}deg)`, background: conic }}
        />
      </div>

      {w.spinning ? (
        <div className="display" style={{ fontSize: 32, color: 'var(--accent)' }}>Крутимо…</div>
      ) : landed ? (
        <div key={w.spinId} className="display wheel-pop" style={{ fontSize: 40, color: 'var(--team)' }}>
          {landed.name}
        </div>
      ) : (
        <div className="mono" style={{ color: 'var(--ink-3)', fontSize: 20 }}>
          {remaining > 0 ? 'Готові крутити' : w.total ? 'Розподіл завершено' : 'Очікування…'}
        </div>
      )}

      <div className="row" style={{ justifyContent: 'center' }}>
        {teams.map((t, i) => (
          <span key={t.id} className={`pill team-${t.os}`}>
            <span className="dot" style={{ background: 'var(--team)' }} />
            {t.name}: {w.counts?.[i] ?? 0}
          </span>
        ))}
        <span className="pill">лишилось: {Math.max(0, remaining)}</span>
      </div>
    </div>
  );
}
